import SwiftProtobuf
import Foundation

fileprivate let _protobuf_package = ""
fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

public struct A {
  public var `operator`: String = String()

  public var `extension`: [String] = []

  fileprivate var _description_p: Msg? = nil

  public var description_p: Msg {
    get {return _description_p ?? Msg()}
    set {_description_p = newValue}
  }

  public var hasDescriptionP: Bool {return self._description_p != nil}

  public mutating func clearDescriptionP() {self._description_p = nil}

  public var unknownFields = SwiftProtobuf.UnknownStorage()

  public init() {}
}

#if swift(>=5.5) && canImport(_Concurrency)
extension A: @unchecked Sendable {}
#endif

extension A: SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = _protobuf_package + ".A"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    3: .same(proto: "operator"),
    4: .same(proto: "extension"),
    5: .same(proto: "description"),
  ]
}

extension A: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase {
  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      switch fieldNumber {
      case 3: try { try decoder.decodeSingularStringField(value: &self.`operator`) }()
      case 4: try { try decoder.decodeRepeatedStringField(value: &self.`extension`) }()
      case 5: try { try decoder.decodeSingularMessageField(value: &self._description_p) }()
      default: break
      }
    }
  }
}

extension A {
  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    if self.`operator` != String() {
      try visitor.visitSingularStringField(value: self.`operator`, fieldNumber: 3)
    }
    if !self.`extension`.isEmpty {
      try visitor.visitRepeatedStringField(value: self.`extension`, fieldNumber: 4)
    }
    try { if let v = self._description_p {
      try visitor.visitSingularMessageField(value: v, fieldNumber: 5)
    } }()
    try unknownFields.traverse(visitor: &visitor)
  }
}

extension A {
  public static func == (lhs: A, rhs: A) -> Bool {
    if lhs.`operator` != rhs.`operator` { return false }
    if lhs.`extension` != rhs.`extension` { return false }
    if lhs._description_p != rhs._description_p { return false }
    if lhs.unknownFields != rhs.unknownFields { return false }
    return true
  }
}
