import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const mode = process.argv[2] || "deploy";
const contractAddress = process.env.NEXT_PUBLIC_FLICK_CONTRACT_ADDRESS;

if (mode === "deploy" && !contractAddress) {
  throw new Error("NEXT_PUBLIC_FLICK_CONTRACT_ADDRESS is required before deploying the Goldsky subgraph.");
}

const sourceDir = path.join(root, "subgraph");
const outputDir = path.join(sourceDir, "generated-deploy");

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const entry of ["schema.graphql", "src", "abis"]) {
  fs.cpSync(path.join(sourceDir, entry), path.join(outputDir, entry), { recursive: true });
}

const yaml = fs
  .readFileSync(path.join(sourceDir, "subgraph.yaml"), "utf8")
  .replace(
    "${NEXT_PUBLIC_FLICK_CONTRACT_ADDRESS}",
    contractAddress || "0x0000000000000000000000000000000000000000"
  );

fs.writeFileSync(path.join(outputDir, "subgraph.yaml"), yaml);
console.log(`Prepared Goldsky subgraph for ${contractAddress || "codegen placeholder"}`);
