import { BigDecimal, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  CreatorClaimed,
  EurcTipSent,
  UsdcTipSent
} from "../generated/FlickRegistry/FlickRegistry";
import { Creator, EurcTip, UsdcTip } from "../generated/schema";

const DECIMALS = BigDecimal.fromString("1000000");

function tokenAmount(raw: BigInt): BigDecimal {
  return raw.toBigDecimal().div(DECIMALS);
}

function creatorId(address: Bytes): string {
  return address.toHexString().toLowerCase();
}

function getOrCreateCreator(id: string, nickname: string, timestamp: BigInt): Creator {
  let creator = Creator.load(id);
  if (creator == null) {
    creator = new Creator(id);
    creator.nickname = nickname;
    creator.totalUsdcTipsReceived = BigDecimal.zero();
    creator.totalEurcTipsReceived = BigDecimal.zero();
    creator.createdAt = timestamp;
  }
  return creator as Creator;
}

export function handleCreatorClaimed(event: CreatorClaimed): void {
  let id = creatorId(event.params.creator);
  let creator = getOrCreateCreator(id, event.params.nickname, event.params.timestamp);
  creator.nickname = event.params.nickname;
  creator.createdAt = event.params.timestamp;
  creator.save();
}

export function handleUsdcTipSent(event: UsdcTipSent): void {
  let id = creatorId(event.params.creator);
  let creator = getOrCreateCreator(id, event.params.nickname, event.params.timestamp);
  let amount = tokenAmount(event.params.amount);
  creator.totalUsdcTipsReceived = creator.totalUsdcTipsReceived.plus(amount);
  creator.save();

  let tip = new UsdcTip(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  tip.creator = creator.id;
  tip.senderAddress = event.params.sender;
  tip.senderName = event.params.senderName;
  tip.amountUSDC = amount;
  tip.message = event.params.message;
  tip.timestamp = event.params.timestamp;
  tip.save();
}

export function handleEurcTipSent(event: EurcTipSent): void {
  let id = creatorId(event.params.creator);
  let creator = getOrCreateCreator(id, event.params.nickname, event.params.timestamp);
  let amount = tokenAmount(event.params.amount);
  creator.totalEurcTipsReceived = creator.totalEurcTipsReceived.plus(amount);
  creator.save();

  let tip = new EurcTip(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  tip.creator = creator.id;
  tip.senderAddress = event.params.sender;
  tip.senderName = event.params.senderName;
  tip.amountEURC = amount;
  tip.message = event.params.message;
  tip.timestamp = event.params.timestamp;
  tip.save();
}
