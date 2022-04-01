import SwiftProtobuf
import Foundation

fileprivate let _protobuf_package = "pbkit.pingpong"
fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

public struct Pbkit_Pingpong_LessScalar {
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

  public var unknownFields = SwiftProtobuf.UnknownStorage()

  public init() {}
}

#if swift(>=5.5) && canImport(_Concurrency)
extension Pbkit_Pingpong_LessScalar: @unchecked Sendable {}
#endif

extension Pbkit_Pingpong_LessScalar: SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = _protobuf_package + ".LessScalar"
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
  ]
}

extension Pbkit_Pingpong_LessScalar: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase {
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
      default: break
      }
    }
  }
}

extension Pbkit_Pingpong_LessScalar: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase {
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
    try unknownFields.traverse(visitor: &visitor)
    }
  }
}

extension Pbkit_Pingpong_LessScalar {
  public static func == (lhs: Pbkit_Pingpong_LessScalar, rhs: Pbkit_Pingpong_LessScalar) -> Bool {
    if lhs.double != rhs.double { return false }
    if lhs.float != rhs.float { return false }
    if lhs.int32 != rhs.int32 { return false }
    if lhs.int64 != rhs.int64 { return false }
    if lhs.uint32 != rhs.uint32 { return false }
    if lhs.uint64 != rhs.uint64 { return false }
    if lhs.sint32 != rhs.sint32 { return false }
    if lhs.sint64 != rhs.sint64 { return false }
    if lhs.fixed32 != rhs.fixed32 { return false }
    if lhs.fixed64 != rhs.fixed64 { return false }
    if lhs.sfixed32 != rhs.sfixed32 { return false }
    if lhs.sfixed64 != rhs.sfixed64 { return false }
    if lhs.bool != rhs.bool { return false }
    if lhs.string != rhs.string { return false }
    if lhs.bytes != rhs.bytes { return false }
    if lhs.unknownFields != rhs.unknownFields { return false }
    return true
  }
}
