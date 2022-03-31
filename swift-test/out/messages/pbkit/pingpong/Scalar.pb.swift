import SwiftProtobuf
import Foundation

fileprivate let _protobuf_package = "pbkit.pingpong"
fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

public struct Pbkit_Pingpong_Scalar {
  public var double: Double

  public var float: Float

  public var int32: Int32

  public var int64: Int64

  public var uint32: UInt32

  public var uint64: UInt64

  public var sint32: Int32

  public var sint64: Int64

  public var fixed32: UInt32

  public var fixed64: UInt64

  public var sfixed32: Int32

  public var sfixed64: Int64

  public var bool: Bool

  public var string: String

  public var bytes: Data

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
      case 7: try { try decoder.decodeSingularInt32Field(value: &self.sint32) }()
      case 8: try { try decoder.decodeSingularInt64Field(value: &self.sint64) }()
      case 9: try { try decoder.decodeSingularUInt32Field(value: &self.fixed32) }()
      case 10: try { try decoder.decodeSingularUInt64Field(value: &self.fixed64) }()
      case 11: try { try decoder.decodeSingularInt32Field(value: &self.sfixed32) }()
      case 12: try { try decoder.decodeSingularInt64Field(value: &self.sfixed64) }()
      case 13: try { try decoder.decodeSingularBoolField(value: &self.bool) }()
      case 14: try { try decoder.decodeSingularStringField(value: &self.string) }()
      case 15: try { try decoder.decodeSingularDataField(value: &self.bytes) }()
      case 16: try { try decoder.decodeRepeatedDoubleField(value: &self.rdouble) }()
      case 17: try { try decoder.decodeRepeatedFloatField(value: &self.rfloat) }()
      case 18: try { try decoder.decodeRepeatedInt32Field(value: &self.rint32) }()
      case 19: try { try decoder.decodeRepeatedInt64Field(value: &self.rint64) }()
      case 20: try { try decoder.decodeRepeatedUInt32Field(value: &self.ruint32) }()
      case 21: try { try decoder.decodeRepeatedUInt64Field(value: &self.ruint64) }()
      case 22: try { try decoder.decodeRepeatedInt32Field(value: &self.rsint32) }()
      case 23: try { try decoder.decodeRepeatedInt64Field(value: &self.rsint64) }()
      case 24: try { try decoder.decodeRepeatedUInt32Field(value: &self.rfixed32) }()
      case 25: try { try decoder.decodeRepeatedUInt64Field(value: &self.rfixed64) }()
      case 26: try { try decoder.decodeRepeatedInt32Field(value: &self.rsfixed32) }()
      case 27: try { try decoder.decodeRepeatedInt64Field(value: &self.rsfixed64) }()
      case 28: try { try decoder.decodeRepeatedBoolField(value: &self.rbool) }()
      case 29: try { try decoder.decodeRepeatedStringField(value: &self.rstring) }()
      case 30: try { try decoder.decodeRepeatedDataField(value: &self.rbytes) }()
      case 31: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<TODO, TODO>.self, value: &self.mdouble) }()
      case 32: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<TODO, TODO>.self, value: &self.mfloat) }()
      case 33: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<TODO, TODO>.self, value: &self.mint32) }()
      case 34: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<TODO, TODO>.self, value: &self.mint64) }()
      case 35: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<TODO, TODO>.self, value: &self.muint32) }()
      case 36: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<TODO, TODO>.self, value: &self.muint64) }()
      case 37: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<TODO, TODO>.self, value: &self.msint32) }()
      case 38: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<TODO, TODO>.self, value: &self.msint64) }()
      case 39: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<TODO, TODO>.self, value: &self.mfixed32) }()
      case 40: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<TODO, TODO>.self, value: &self.mfixed64) }()
      case 41: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<TODO, TODO>.self, value: &self.msfixed32) }()
      case 42: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<TODO, TODO>.self, value: &self.msfixed64) }()
      case 43: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<TODO, TODO>.self, value: &self.mbool) }()
      case 44: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<TODO, TODO>.self, value: &self.mstring) }()
      case 45: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<TODO, TODO>.self, value: &self.mbytes) }()
      default: break
      }
    }
  }
}
