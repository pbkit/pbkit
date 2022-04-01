import SwiftProtobuf
import Foundation

fileprivate let _protobuf_package = "pbkit.pingpong"
fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

public struct Pbkit_Pingpong_Scalar {
  public var double: Double = 0

  public var float: Float = 0

  public var int32: Int32 = 0

  public var int64: Int64 = 0

  public var uint32: UInt32 = 0

  public var uint64: UInt64 = 0

  public var sint32: Int32 = 0

  public var sint64: Int64 = 0

  public var fixed32: UInt32 = 0

  public var fixed64: UInt64 = 0

  public var sfixed32: Int32 = 0

  public var sfixed64: Int64 = 0

  public var bool: Bool = false

  public var string: String = String()

  public var bytes: Data = Data()

  public var rdouble: [Double] = []

  public var rfloat: [Float] = []

  public var rint32: [Int32] = []

  public var rint64: [Int64] = []

  public var ruint32: [UInt32] = []

  public var ruint64: [UInt64] = []

  public var rsint32: [Int32] = []

  public var rsint64: [Int64] = []

  public var rfixed32: [UInt32] = []

  public var rfixed64: [UInt64] = []

  public var rsfixed32: [Int32] = []

  public var rsfixed64: [Int64] = []

  public var rbool: [Bool] = []

  public var rstring: [String] = []

  public var rbytes: [Data] = []

  public var mdouble: Dictionary<String, Double> = [:]

  public var mfloat: Dictionary<String, Float> = [:]

  public var mint32: Dictionary<String, Int32> = [:]

  public var mint64: Dictionary<String, Int64> = [:]

  public var muint32: Dictionary<String, UInt32> = [:]

  public var muint64: Dictionary<String, UInt64> = [:]

  public var msint32: Dictionary<String, Int32> = [:]

  public var msint64: Dictionary<String, Int64> = [:]

  public var mfixed32: Dictionary<String, UInt32> = [:]

  public var mfixed64: Dictionary<String, UInt64> = [:]

  public var msfixed32: Dictionary<String, Int32> = [:]

  public var msfixed64: Dictionary<String, Int64> = [:]

  public var mbool: Dictionary<String, Bool> = [:]

  public var mstring: Dictionary<String, String> = [:]

  public var mbytes: Dictionary<String, Data> = [:]

  public var unknownFields = SwiftProtobuf.UnknownStorage()

  public init() {}
}

#if swift(>=5.5) && canImport(_Concurrency)
extension Pbkit_Pingpong_Scalar: @unchecked Sendable {}
#endif

extension Pbkit_Pingpong_Scalar: SwiftProtobuf._ProtoNameProviding {
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    1: .same(proto: "double"),
    2: .same(proto: "float"),
    3: .same(proto: "int32"),
    4: .same(proto: "int64"),
    5: .same(proto: "uint32"),
    6: .same(proto: "uint64"),
    7: .same(proto: "sint32"),
    8: .same(proto: "sint64"),
    9: .same(proto: "fixed32"),
    10: .same(proto: "fixed64"),
    11: .same(proto: "sfixed32"),
    12: .same(proto: "sfixed64"),
    13: .same(proto: "bool"),
    14: .same(proto: "string"),
    15: .same(proto: "bytes"),
    16: .same(proto: "rdouble"),
    17: .same(proto: "rfloat"),
    18: .same(proto: "rint32"),
    19: .same(proto: "rint64"),
    20: .same(proto: "ruint32"),
    21: .same(proto: "ruint64"),
    22: .same(proto: "rsint32"),
    23: .same(proto: "rsint64"),
    24: .same(proto: "rfixed32"),
    25: .same(proto: "rfixed64"),
    26: .same(proto: "rsfixed32"),
    27: .same(proto: "rsfixed64"),
    28: .same(proto: "rbool"),
    29: .same(proto: "rstring"),
    30: .same(proto: "rbytes"),
    31: .same(proto: "mdouble"),
    32: .same(proto: "mfloat"),
    33: .same(proto: "mint32"),
    34: .same(proto: "mint64"),
    35: .same(proto: "muint32"),
    36: .same(proto: "muint64"),
    37: .same(proto: "msint32"),
    38: .same(proto: "msint64"),
    39: .same(proto: "mfixed32"),
    40: .same(proto: "mfixed64"),
    41: .same(proto: "msfixed32"),
    42: .same(proto: "msfixed64"),
    43: .same(proto: "mbool"),
    44: .same(proto: "mstring"),
    45: .same(proto: "mbytes"),
  ]
}

extension Pbkit_Pingpong_Scalar: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase {
  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      switch fieldNumber {
      case 1: try { try decoder.decodeSingularDoubleField(value: &self.double) }()
      case 2: try { try decoder.decodeSingularFloatField(value: &self.float) }()
      case 3: try { try decoder.decodeSingularInt32Field(value: &self.int32) }()
      case 4: try { try decoder.decodeSingularInt64Field(value: &self.int64) }()
      case 5: try { try decoder.decodeSingularUInt32Field(value: &self.uint32) }()
      case 6: try { try decoder.decodeSingularUInt64Field(value: &self.uint64) }()
      case 7: try { try decoder.decodeSingularSInt32Field(value: &self.sint32) }()
      case 8: try { try decoder.decodeSingularSInt64Field(value: &self.sint64) }()
      case 9: try { try decoder.decodeSingularFixed32Field(value: &self.fixed32) }()
      case 10: try { try decoder.decodeSingularFixed64Field(value: &self.fixed64) }()
      case 11: try { try decoder.decodeSingularSFixed32Field(value: &self.sfixed32) }()
      case 12: try { try decoder.decodeSingularSFixed64Field(value: &self.sfixed64) }()
      case 13: try { try decoder.decodeSingularBoolField(value: &self.bool) }()
      case 14: try { try decoder.decodeSingularStringField(value: &self.string) }()
      case 15: try { try decoder.decodeSingularBytesField(value: &self.bytes) }()
      case 16: try { try decoder.decodeRepeatedDoubleField(value: &self.rdouble) }()
      case 17: try { try decoder.decodeRepeatedFloatField(value: &self.rfloat) }()
      case 18: try { try decoder.decodeRepeatedInt32Field(value: &self.rint32) }()
      case 19: try { try decoder.decodeRepeatedInt64Field(value: &self.rint64) }()
      case 20: try { try decoder.decodeRepeatedUInt32Field(value: &self.ruint32) }()
      case 21: try { try decoder.decodeRepeatedUInt64Field(value: &self.ruint64) }()
      case 22: try { try decoder.decodeRepeatedSInt32Field(value: &self.rsint32) }()
      case 23: try { try decoder.decodeRepeatedSInt64Field(value: &self.rsint64) }()
      case 24: try { try decoder.decodeRepeatedFixed32Field(value: &self.rfixed32) }()
      case 25: try { try decoder.decodeRepeatedFixed64Field(value: &self.rfixed64) }()
      case 26: try { try decoder.decodeRepeatedSFixed32Field(value: &self.rsfixed32) }()
      case 27: try { try decoder.decodeRepeatedSFixed64Field(value: &self.rsfixed64) }()
      case 28: try { try decoder.decodeRepeatedBoolField(value: &self.rbool) }()
      case 29: try { try decoder.decodeRepeatedStringField(value: &self.rstring) }()
      case 30: try { try decoder.decodeRepeatedBytesField(value: &self.rbytes) }()
      case 31: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufDouble>.self, value: &self.mdouble) }()
      case 32: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufFloat>.self, value: &self.mfloat) }()
      case 33: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufInt32>.self, value: &self.mint32) }()
      case 34: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufInt64>.self, value: &self.mint64) }()
      case 35: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufUInt32>.self, value: &self.muint32) }()
      case 36: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufUInt64>.self, value: &self.muint64) }()
      case 37: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufInt32>.self, value: &self.msint32) }()
      case 38: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufInt64>.self, value: &self.msint64) }()
      case 39: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufUInt32>.self, value: &self.mfixed32) }()
      case 40: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufUInt64>.self, value: &self.mfixed64) }()
      case 41: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufInt32>.self, value: &self.msfixed32) }()
      case 42: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufInt64>.self, value: &self.msfixed64) }()
      case 43: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufBool>.self, value: &self.mbool) }()
      case 44: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufString>.self, value: &self.mstring) }()
      case 45: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufData>.self, value: &self.mbytes) }()
      default: break
      }
    }
  }
}

extension Pbkit_Pingpong_Scalar: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase {
  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    if self.double != 0 {
      try visitor.visitSingularDoubleField(value: self.double, fieldNumber: 1)
    }
    if self.float != 0 {
      try visitor.visitSingularFloatField(value: self.float, fieldNumber: 2)
    }
    if self.int32 != 0 {
      try visitor.visitSingularInt32Field(value: self.int32, fieldNumber: 3)
    }
    if self.int64 != 0 {
      try visitor.visitSingularInt64Field(value: self.int64, fieldNumber: 4)
    }
    if self.uint32 != 0 {
      try visitor.visitSingularUInt32Field(value: self.uint32, fieldNumber: 5)
    }
    if self.uint64 != 0 {
      try visitor.visitSingularUInt64Field(value: self.uint64, fieldNumber: 6)
    }
    if self.sint32 != 0 {
      try visitor.visitSingularSInt32Field(value: self.sint32, fieldNumber: 7)
    }
    if self.sint64 != 0 {
      try visitor.visitSingularSInt64Field(value: self.sint64, fieldNumber: 8)
    }
    if self.fixed32 != 0 {
      try visitor.visitSingularFixed32Field(value: self.fixed32, fieldNumber: 9)
    }
    if self.fixed64 != 0 {
      try visitor.visitSingularFixed64Field(value: self.fixed64, fieldNumber: 10)
    }
    if self.sfixed32 != 0 {
      try visitor.visitSingularSFixed32Field(value: self.sfixed32, fieldNumber: 11)
    }
    if self.sfixed64 != 0 {
      try visitor.visitSingularSFixed64Field(value: self.sfixed64, fieldNumber: 12)
    }
    if self.bool != false {
      try visitor.visitSingularBoolField(value: self.bool, fieldNumber: 13)
    }
    if self.string != String() {
      try visitor.visitSingularStringField(value: self.string, fieldNumber: 14)
    }
    if self.bytes != Data() {
      try visitor.visitSingularBytesField(value: self.bytes, fieldNumber: 15)
    }
    if !self.rdouble.isEmpty {
      try visitor.visitPackedDoubleField(value: self.rdouble, fieldNumber: 16)
    }
    if !self.rfloat.isEmpty {
      try visitor.visitPackedFloatField(value: self.rfloat, fieldNumber: 17)
    }
    if !self.rint32.isEmpty {
      try visitor.visitPackedInt32Field(value: self.rint32, fieldNumber: 18)
    }
    if !self.rint64.isEmpty {
      try visitor.visitPackedInt64Field(value: self.rint64, fieldNumber: 19)
    }
    if !self.ruint32.isEmpty {
      try visitor.visitPackedUInt32Field(value: self.ruint32, fieldNumber: 20)
    }
    if !self.ruint64.isEmpty {
      try visitor.visitPackedUInt64Field(value: self.ruint64, fieldNumber: 21)
    }
    if !self.rsint32.isEmpty {
      try visitor.visitPackedSInt32Field(value: self.rsint32, fieldNumber: 22)
    }
    if !self.rsint64.isEmpty {
      try visitor.visitPackedSInt64Field(value: self.rsint64, fieldNumber: 23)
    }
    if !self.rfixed32.isEmpty {
      try visitor.visitPackedFixed32Field(value: self.rfixed32, fieldNumber: 24)
    }
    if !self.rfixed64.isEmpty {
      try visitor.visitPackedFixed64Field(value: self.rfixed64, fieldNumber: 25)
    }
    if !self.rsfixed32.isEmpty {
      try visitor.visitPackedSFixed32Field(value: self.rsfixed32, fieldNumber: 26)
    }
    if !self.rsfixed64.isEmpty {
      try visitor.visitPackedSFixed64Field(value: self.rsfixed64, fieldNumber: 27)
    }
    if !self.rbool.isEmpty {
      try visitor.visitPackedBoolField(value: self.rbool, fieldNumber: 28)
    }
    if !self.rstring.isEmpty {
      try visitor.visitPackedStringField(value: self.rstring, fieldNumber: 29)
    }
    if !self.rbytes.isEmpty {
      try visitor.visitPackedBytesField(value: self.rbytes, fieldNumber: 30)
    }
    if !self.mdouble.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufDouble>.self, value: self.mdouble, fieldNumber: 31)
    }
    if !self.mfloat.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufFloat>.self, value: self.mfloat, fieldNumber: 32)
    }
    if !self.mint32.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufInt32>.self, value: self.mint32, fieldNumber: 33)
    }
    if !self.mint64.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufInt64>.self, value: self.mint64, fieldNumber: 34)
    }
    if !self.muint32.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufUInt32>.self, value: self.muint32, fieldNumber: 35)
    }
    if !self.muint64.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufUInt64>.self, value: self.muint64, fieldNumber: 36)
    }
    if !self.msint32.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufInt32>.self, value: self.msint32, fieldNumber: 37)
    }
    if !self.msint64.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufInt64>.self, value: self.msint64, fieldNumber: 38)
    }
    if !self.mfixed32.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufUInt32>.self, value: self.mfixed32, fieldNumber: 39)
    }
    if !self.mfixed64.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufUInt64>.self, value: self.mfixed64, fieldNumber: 40)
    }
    if !self.msfixed32.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufInt32>.self, value: self.msfixed32, fieldNumber: 41)
    }
    if !self.msfixed64.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufInt64>.self, value: self.msfixed64, fieldNumber: 42)
    }
    if !self.mbool.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufBool>.self, value: self.mbool, fieldNumber: 43)
    }
    if !self.mstring.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufString>.self, value: self.mstring, fieldNumber: 44)
    }
    if !self.mbytes.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufData>.self, value: self.mbytes, fieldNumber: 45)
    }
    try unknownFields.traverse(visitor: &visitor)
  }
}
