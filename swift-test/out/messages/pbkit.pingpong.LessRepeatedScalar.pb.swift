import SwiftProtobuf
import Foundation

fileprivate let _protobuf_package = "pbkit.pingpong"
fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

public struct Pbkit_Pingpong_LessRepeatedScalar {
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

  public var unknownFields = SwiftProtobuf.UnknownStorage()

  public init() {}
}

#if swift(>=5.5) && canImport(_Concurrency)
extension Pbkit_Pingpong_LessRepeatedScalar: @unchecked Sendable {}
#endif

extension Pbkit_Pingpong_LessRepeatedScalar: SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = _protobuf_package + ".LessRepeatedScalar"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
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
  ]
}

extension Pbkit_Pingpong_LessRepeatedScalar: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase {
  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      switch fieldNumber {
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
      default: break
      }
    }
  }
}

extension Pbkit_Pingpong_LessRepeatedScalar {
  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    if !self.rdouble.isEmpty {
      try visitor.visitRepeatedDoubleField(value: self.rdouble, fieldNumber: 16)
    }
    if !self.rfloat.isEmpty {
      try visitor.visitRepeatedFloatField(value: self.rfloat, fieldNumber: 17)
    }
    if !self.rint32.isEmpty {
      try visitor.visitRepeatedInt32Field(value: self.rint32, fieldNumber: 18)
    }
    if !self.rint64.isEmpty {
      try visitor.visitRepeatedInt64Field(value: self.rint64, fieldNumber: 19)
    }
    if !self.ruint32.isEmpty {
      try visitor.visitRepeatedUInt32Field(value: self.ruint32, fieldNumber: 20)
    }
    if !self.ruint64.isEmpty {
      try visitor.visitRepeatedUInt64Field(value: self.ruint64, fieldNumber: 21)
    }
    if !self.rsint32.isEmpty {
      try visitor.visitRepeatedSInt32Field(value: self.rsint32, fieldNumber: 22)
    }
    if !self.rsint64.isEmpty {
      try visitor.visitRepeatedSInt64Field(value: self.rsint64, fieldNumber: 23)
    }
    if !self.rfixed32.isEmpty {
      try visitor.visitRepeatedFixed32Field(value: self.rfixed32, fieldNumber: 24)
    }
    if !self.rfixed64.isEmpty {
      try visitor.visitRepeatedFixed64Field(value: self.rfixed64, fieldNumber: 25)
    }
    if !self.rsfixed32.isEmpty {
      try visitor.visitRepeatedSFixed32Field(value: self.rsfixed32, fieldNumber: 26)
    }
    if !self.rsfixed64.isEmpty {
      try visitor.visitRepeatedSFixed64Field(value: self.rsfixed64, fieldNumber: 27)
    }
    if !self.rbool.isEmpty {
      try visitor.visitRepeatedBoolField(value: self.rbool, fieldNumber: 28)
    }
    if !self.rstring.isEmpty {
      try visitor.visitRepeatedStringField(value: self.rstring, fieldNumber: 29)
    }
    if !self.rbytes.isEmpty {
      try visitor.visitRepeatedBytesField(value: self.rbytes, fieldNumber: 30)
    }
    try unknownFields.traverse(visitor: &visitor)
  }
}

extension Pbkit_Pingpong_LessRepeatedScalar {
  public static func == (lhs: Pbkit_Pingpong_LessRepeatedScalar, rhs: Pbkit_Pingpong_LessRepeatedScalar) -> Bool {
    if lhs.rdouble != rhs.rdouble { return false }
    if lhs.rfloat != rhs.rfloat { return false }
    if lhs.rint32 != rhs.rint32 { return false }
    if lhs.rint64 != rhs.rint64 { return false }
    if lhs.ruint32 != rhs.ruint32 { return false }
    if lhs.ruint64 != rhs.ruint64 { return false }
    if lhs.rsint32 != rhs.rsint32 { return false }
    if lhs.rsint64 != rhs.rsint64 { return false }
    if lhs.rfixed32 != rhs.rfixed32 { return false }
    if lhs.rfixed64 != rhs.rfixed64 { return false }
    if lhs.rsfixed32 != rhs.rsfixed32 { return false }
    if lhs.rsfixed64 != rhs.rsfixed64 { return false }
    if lhs.rbool != rhs.rbool { return false }
    if lhs.rstring != rhs.rstring { return false }
    if lhs.rbytes != rhs.rbytes { return false }
    if lhs.unknownFields != rhs.unknownFields { return false }
    return true
  }
}
