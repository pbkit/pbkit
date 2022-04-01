import SwiftProtobuf
import Foundation

fileprivate let _protobuf_package = "pbkit.pingpong"
fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

extension Pbkit_Pingpong_Ping {
  public struct Yahoo {
    public var a: String = String()

    fileprivate var _b: Pbkit_Pingpong_Ping.Yahoo.TripleNested? = nil

    public var b: Pbkit_Pingpong_Ping.Yahoo.TripleNested {
      get {return _b ?? Pbkit_Pingpong_Ping.Yahoo.TripleNested()}
      set {_b = newValue}
    }

    public var hasB: Bool {return self._b != nil}

    public mutating func clearB() {self._b = nil}

    public var unknownFields = SwiftProtobuf.UnknownStorage()

    public init() {}
  }
}

#if swift(>=5.5) && canImport(_Concurrency)
extension Pbkit_Pingpong_Ping.Yahoo: @unchecked Sendable {}
#endif

extension Pbkit_Pingpong_Ping.Yahoo: SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = _protobuf_package + ".Yahoo"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    1: .same(proto: "a"),
    2: .same(proto: "b"),
  ]
}

extension Pbkit_Pingpong_Ping.Yahoo: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase {
  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      switch fieldNumber {
      case 1: try { try decoder.decodeSingularStringField(value: &self.a) }()
      case 2: try { try decoder.decodeSingularMessageField(value: &self.b) }()
      default: break
      }
    }
  }
}

extension Pbkit_Pingpong_Ping.Yahoo: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase {
  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    if self.a != String() {
      try visitor.visitSingularStringField(value: self.a, fieldNumber: 1)
    }
    try { if let v = self._b {
      try visitor.visitSingularMessageField(value: v, fieldNumber: 2)
    } }()
    try unknownFields.traverse(visitor: &visitor)
    }
  }
}

extension Pbkit_Pingpong_Ping.Yahoo {
  public static func == (lhs: Pbkit_Pingpong_Ping.Yahoo, rhs: Pbkit_Pingpong_Ping.Yahoo) -> Bool {
    if lhs.a != rhs.a { return false }
    if lhs.b != rhs.b { return false }
    if lhs.unknownFields != rhs.unknownFields { return false }
    return true
  }
}
