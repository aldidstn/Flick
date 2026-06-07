import { Kind, parse, visit } from "graphql";
import type { ArgumentNode, FieldNode } from "graphql";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 12_000;
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 10_000;

const allowedRoots: Record<string, Set<string>> = {
  CreatorByNickname: new Set(["creatorClaimeds"]),
  CreatorByWallet: new Set(["creatorClaimeds"]),
  TopCreatorEvents: new Set(["creatorClaimeds", "usdcTipSents", "eurcTipSents"]),
  RecentTips: new Set(["usdcTipSents", "eurcTipSents"])
};

const allowedFields: Record<string, Set<string>> = {
  CreatorByNickname: new Set(["creatorClaimeds", "id", "creator", "nickname", "timestampParam"]),
  CreatorByWallet: new Set(["creatorClaimeds", "id", "creator", "nickname", "timestampParam"]),
  TopCreatorEvents: new Set([
    "creatorClaimeds",
    "usdcTipSents",
    "eurcTipSents",
    "id",
    "creator",
    "nickname",
    "timestampParam",
    "amount"
  ]),
  RecentTips: new Set(["usdcTipSents", "eurcTipSents", "id", "senderName", "amount", "message", "timestampParam"])
};

const rateLimits = new Map<string, { count: number; resetsAt: number }>();

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { errors: [{ message }] },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
      }
    }
  );
}

function clientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.ip || "unknown";
}

function isRateLimited(request: NextRequest) {
  const now = Date.now();
  const ip = clientIp(request);
  const current = rateLimits.get(ip);

  if (!current || current.resetsAt <= now) {
    rateLimits.set(ip, { count: 1, resetsAt: now + RATE_WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT;
}

function hasExpectedWhere(arguments_: readonly ArgumentNode[] | undefined, fieldName: string, variableName: string) {
  const where = arguments_?.find((argument) => argument.name.value === "where")?.value;
  if (where?.kind !== Kind.OBJECT) return false;

  const filter = where.fields.find((field) => field.name.value === fieldName)?.value;
  return filter?.kind === Kind.VARIABLE && filter.name.value === variableName;
}

function firstLimit(field: FieldNode, variables: Record<string, unknown>) {
  const first = field.arguments?.find((argument) => argument.name.value === "first")?.value;
  if (first?.kind === Kind.INT) return Number(first.value);
  if (first?.kind === Kind.VARIABLE) return Number(variables[first.name.value]);
  return Number.NaN;
}

function hasValidFirstLimit(field: FieldNode, variables: Record<string, unknown>, max: number) {
  const limit = firstLimit(field, variables);
  return Number.isInteger(limit) && limit > 0 && limit <= max;
}

function validateOperation(query: string, operationName: string, variables: Record<string, unknown>) {
  const roots = allowedRoots[operationName];
  const fields = allowedFields[operationName];
  if (!roots || !fields) return "GraphQL operation is not allowed.";

  let document;
  try {
    document = parse(query);
  } catch {
    return "Invalid GraphQL document.";
  }

  const operation = document.definitions.find(
    (definition) =>
      definition.kind === Kind.OPERATION_DEFINITION &&
      definition.name?.value === operationName
  );

  if (!operation || operation.kind !== Kind.OPERATION_DEFINITION || operation.operation !== "query") {
    return "Only approved GraphQL queries are allowed.";
  }

  const operationCount = document.definitions.filter((definition) => definition.kind === Kind.OPERATION_DEFINITION).length;
  if (operationCount !== 1) return "Exactly one GraphQL operation is required.";

  const selectedRoots = new Set<string>();
  for (const selection of operation.selectionSet.selections) {
    if (selection.kind !== Kind.FIELD || !roots.has(selection.name.value)) {
      return "GraphQL field is not allowed.";
    }
    if (selectedRoots.has(selection.name.value)) return "Duplicate GraphQL root field is not allowed.";
    selectedRoots.add(selection.name.value);

    if (operationName === "CreatorByNickname") {
      if (!hasExpectedWhere(selection.arguments, "nickname", "nickname") || !hasValidFirstLimit(selection, variables, 1)) {
        return "Invalid creator query.";
      }
    } else if (operationName === "CreatorByWallet") {
      if (!hasExpectedWhere(selection.arguments, "creator", "creator") || !hasValidFirstLimit(selection, variables, 1)) {
        return "Invalid creator query.";
      }
    } else if (operationName === "RecentTips") {
      if (!hasExpectedWhere(selection.arguments, "creator", "creator") || !hasValidFirstLimit(selection, variables, 12)) {
        return "Invalid recent tips query.";
      }
    } else {
      const max = selection.name.value === "creatorClaimeds" ? 100 : 500;
      if (!hasValidFirstLimit(selection, variables, max)) return "Requested result limit is too large.";
    }
  }
  if (selectedRoots.size !== roots.size) return "GraphQL operation is incomplete.";

  let hasDisallowedField = false;
  visit(document, {
    Field(node) {
      if (node.name.value !== "__typename" && !fields.has(node.name.value)) {
        hasDisallowedField = true;
      }
    }
  });
  if (hasDisallowedField) {
    return "GraphQL field is not allowed.";
  }

  if (operationName === "CreatorByNickname" && typeof variables.nickname !== "string") {
    return "Missing nickname query variable.";
  }

  if ((operationName === "CreatorByWallet" || operationName === "RecentTips") && typeof variables.creator !== "string") {
    return "Missing creator query variable.";
  }

  return null;
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return errorResponse("Cross-origin GraphQL requests are not allowed.", 403);
  }

  if (isRateLimited(request)) {
    return errorResponse("Too many GraphQL requests. Please try again shortly.", 429);
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return errorResponse("GraphQL request is too large.", 413);
  }

  let body: { query?: unknown; operationName?: unknown; variables?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  if (typeof body.query !== "string" || body.query.length > MAX_BODY_BYTES || typeof body.operationName !== "string") {
    return errorResponse("Invalid GraphQL request.", 400);
  }

  const variables =
    body.variables && typeof body.variables === "object" && !Array.isArray(body.variables)
      ? (body.variables as Record<string, unknown>)
      : {};
  const validationError = validateOperation(body.query, body.operationName, variables);
  if (validationError) return errorResponse(validationError, 403);

  const endpoint = process.env.GOLDSKY_GRAPHQL_URL;
  if (!endpoint) return errorResponse("Goldsky endpoint is not configured.", 503);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.GOLDSKY_API_KEY) {
    headers.Authorization = `Bearer ${process.env.GOLDSKY_API_KEY}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: body.query, operationName: body.operationName, variables }),
      cache: "no-store"
    });
    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return errorResponse("Goldsky request failed.", 502);
  }
}
