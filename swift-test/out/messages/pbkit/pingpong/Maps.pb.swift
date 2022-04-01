import SwiftProtobuf
import Foundation

fileprivate let _protobuf_package = "pbkit.pingpong"
fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

public struct Pbkit_Pingpong_Maps {
  public var mdouble: Dictionary<String, Double> = [:]

  public var mfloat: Dictionary<String, Float> = [:]

  public var mint32: Dictionary<String, Int32> = [:]

  public var mint64: Dictionary<String, Int64> = [:]

  public var muint32: Dictionary<String, UInt32> = [:]

  public var mfixed32: Dictionary<String, UInt32> = [:]

  public var mfixed64: Dictionary<String, UInt64> = [:]

  public var msfixed32: Dictionary<String, Int32> = [:]

  public var msfixed64: Dictionary<String, Int64> = [:]

  public var mbool: Dictionary<String, Bool> = [:]

  public var mstring: Dictionary<String, String> = [:]

  public var mbytes: Dictionary<String, Data> = [:]

  public var mmsg: Dictionary<String, Pbkit_Pingpong_MapsMsg> = [:]

  public var mint32Msg: Dictionary<Int32, Pbkit_Pingpong_MapsMsg> = [:]

  public var menum: Dictionary<String, Pbkit_Pingpong_MapsEnum> = [:]

  public var unknownFields = SwiftProtobuf.UnknownStorage()

  public init() {}
}

#if swift(>=5.5) && canImport(_Concurrency)
extension Pbkit_Pingpong_Maps: @unchecked Sendable {}
#endif

extension Pbkit_Pingpong_Maps: SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = _protobuf_package + ".Maps"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    1: .same(proto: "mdouble"),
    2: .same(proto: "mfloat"),
    3: .same(proto: "mint32"),
    4: .same(proto: "mint64"),
    5: .same(proto: "muint32"),
    9: .same(proto: "mfixed32"),
    10: .same(proto: "mfixed64"),
    11: .same(proto: "msfixed32"),
    12: .same(proto: "msfixed64"),
    13: .same(proto: "mbool"),
    14: .same(proto: "mstring"),
    15: .same(proto: "mbytes"),
    16: .same(proto: "mmsg"),
    17: .same(proto: "mint32msg"),
    18: .same(proto: "menum"),
  ]
}

extension Pbkit_Pingpong_Maps: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase {
  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      switch fieldNumber {
      case 1: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufDouble>.self, value: &self.mdouble) }()
      case 2: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufFloat>.self, value: &self.mfloat) }()
      case 3: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufInt32>.self, value: &self.mint32) }()
      case 4: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufInt64>.self, value: &self.mint64) }()
      case 5: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufUInt32>.self, value: &self.muint32) }()
      case 9: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufUInt32>.self, value: &self.mfixed32) }()
      case 10: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufUInt64>.self, value: &self.mfixed64) }()
      case 11: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufInt32>.self, value: &self.msfixed32) }()
      case 12: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufInt64>.self, value: &self.msfixed64) }()
      case 13: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufBool>.self, value: &self.mbool) }()
      case 14: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufString>.self, value: &self.mstring) }()
      case 15: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufData>.self, value: &self.mbytes) }()
      case 16: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMessageMap<SwiftProtobuf.ProtobufString, Pbkit_Pingpong_MapsMsg>.self, value: &self.mmsg) }()
      case 17: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMessageMap<SwiftProtobuf.ProtobufInt32, Pbkit_Pingpong_MapsMsg>.self, value: &self.mint32Msg) }()
      case 18: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufEnumMap<SwiftProtobuf.ProtobufString, Pbkit_Pingpong_MapsEnum>.self, value: &self.menum) }()
      default: break
      }
    }
  }
}

extension Pbkit_Pingpong_Maps: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase {
  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    if !self.mdouble.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufDouble>.self, value: self.mdouble, fieldNumber: 1)
    }
    if !self.mfloat.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufFloat>.self, value: self.mfloat, fieldNumber: 2)
    }
    if !self.mint32.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufInt32>.self, value: self.mint32, fieldNumber: 3)
    }
    if !self.mint64.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufInt64>.self, value: self.mint64, fieldNumber: 4)
    }
    if !self.muint32.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufUInt32>.self, value: self.muint32, fieldNumber: 5)
    }
    if !self.mfixed32.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufUInt32>.self, value: self.mfixed32, fieldNumber: 9)
    }
    if !self.mfixed64.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufUInt64>.self, value: self.mfixed64, fieldNumber: 10)
    }
    if !self.msfixed32.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufInt32>.self, value: self.msfixed32, fieldNumber: 11)
    }
    if !self.msfixed64.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufInt64>.self, value: self.msfixed64, fieldNumber: 12)
    }
    if !self.mbool.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufBool>.self, value: self.mbool, fieldNumber: 13)
    }
    if !self.mstring.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufString>.self, value: self.mstring, fieldNumber: 14)
    }
    if !self.mbytes.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufData>.self, value: self.mbytes, fieldNumber: 15)
    }
    if !self.mmsg.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMessageMap<SwiftProtobuf.ProtobufString, Pbkit_Pingpong_MapsMsg>.self, value: self.mmsg, fieldNumber: 16)
    }
    if !self.mint32Msg.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMessageMap<SwiftProtobuf.ProtobufInt32, Pbkit_Pingpong_MapsMsg>.self, value: self.mint32Msg, fieldNumber: 17)
    }
    if !self.menum.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufEnumMap<SwiftProtobuf.ProtobufString, Pbkit_Pingpong_MapsEnum>.self, value: self.menum, fieldNumber: 18)
    }
    try unknownFields.traverse(visitor: &visitor)
    }
  }
}

extension Pbkit_Pingpong_Maps {
  public static func == (lhs: Pbkit_Pingpong_Maps, rhs: Pbkit_Pingpong_Maps) -> Bool {
    if lhs.mdouble != rhs.mdouble { return false }
    if lhs.mfloat != rhs.mfloat { return false }
    if lhs.mint32 != rhs.mint32 { return false }
    if lhs.mint64 != rhs.mint64 { return false }
    if lhs.muint32 != rhs.muint32 { return false }
    if lhs.mfixed32 != rhs.mfixed32 { return false }
    if lhs.mfixed64 != rhs.mfixed64 { return false }
    if lhs.msfixed32 != rhs.msfixed32 { return false }
    if lhs.msfixed64 != rhs.msfixed64 { return false }
    if lhs.mbool != rhs.mbool { return false }
    if lhs.mstring != rhs.mstring { return false }
    if lhs.mbytes != rhs.mbytes { return false }
    if lhs.mmsg != rhs.mmsg { return false }
    if lhs.mint32Msg != rhs.mint32Msg { return false }
    if lhs.menum != rhs.menum { return false }
    if lhs.unknownFields != rhs.unknownFields { return false }
    return true
  }
}
