import { Unreliable, UnreliablePacket } from "./unreliablePacket";
import { Reliable, ReliablePacket } from "./reliablePacket";
import { Hello, HelloPacket, HelloPacketData } from "./helloPacket";
import { Disconnect, DisconnectPacket } from "./disconnectPacket";
import { Ping, PingPacket } from "../../packets/pingPacket";
import { PolusBuffer } from "../../util/polusBuffer";
import { Room } from "../../util/room";
import {
  Acknowledgement,
  AcknowledgementPacket,
} from "../../packets/acknowledgementPacket";
import { PacketHandler } from "../../packets/packet";

export enum PacketType {
  UnreliablePacket = 0x00,
  ReliablePacket = 0x01,
  HelloPacket = 0x08,
  DisconnectPacket = 0x09,
  AcknowledgementPacket = 0x0a,
  PingPacket = 0x0c,
}

export type ParsedPacketData =
  | UnreliablePacket
  | DisconnectPacket
  | HelloPacketData;

export interface ParsedPacket {
  Type: PacketType;
  Nonce?: number;
  Reliable: boolean;
  Data?: ParsedPacketData;
}

export const Packet: PacketHandler<ParsedPacket> = {
  /**
   *
   * Parses a raw PolusBuffer packet
   *
   * @param {PolusBuffer} packet
   */
  parse(packet: PolusBuffer, room: Room): ParsedPacket {
    const packetType = packet.readU8();
    switch (packetType) {
      case PacketType.ReliablePacket:
        return {
          Reliable: true,
          Type: PacketType.ReliablePacket,
          ...Reliable.parse(packet, room),
        };

      case PacketType.UnreliablePacket:
        return {
          Reliable: false,
          Type: PacketType.UnreliablePacket,
          Data: Unreliable.parse(packet, room),
        };

      case PacketType.HelloPacket:
        return {
          Reliable: true,
          Type: PacketType.HelloPacket,
          ...Hello.parse(packet, room),
        };

      case PacketType.DisconnectPacket:
        return {
          Reliable: false,
          Type: PacketType.DisconnectPacket,
          Data: Disconnect.parse(packet, room),
        };

      case PacketType.AcknowledgementPacket:
        return {
          Reliable: false,
          Type: PacketType.AcknowledgementPacket,
          ...Acknowledgement.parse(packet, room),
        };

      case PacketType.PingPacket:
        return {
          Reliable: true,
          Type: PacketType.PingPacket,
          ...Ping.parse(packet, room),
        };

      default:
        throw new TypeError(
          "Unknown Hazel Packet Type: " + PacketType[packetType]
        );
    }
  },

  serialize(packet: ParsedPacket, room: Room): PolusBuffer {
    var buf = new PolusBuffer();
    buf.writeU8(packet.Type);
    switch (packet.Type) {
      case PacketType.ReliablePacket:
        buf.writeBytes(Reliable.serialize(packet as ReliablePacket, room));
        break;

      case PacketType.UnreliablePacket:
        buf.writeBytes(
          Unreliable.serialize(packet.Data as UnreliablePacket, room)
        );
        break;

      case PacketType.HelloPacket:
        buf.writeBytes(Hello.serialize(packet as HelloPacket, room));
        break;

      case PacketType.DisconnectPacket:
        buf.writeBytes(
          Disconnect.serialize(packet.Data as DisconnectPacket, room)
        );
        break;

      case PacketType.AcknowledgementPacket:
        buf.writeBytes(
          Acknowledgement.serialize(packet as AcknowledgementPacket, room)
        );
        break;

      case PacketType.PingPacket:
        buf.writeBytes(Ping.serialize(packet as PingPacket, room));
        break;
    }
    return buf;
  },
};
