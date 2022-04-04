import SwiftProtobuf
import Foundation

fileprivate let _protobuf_package = "pbkit.pingpong"
fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

public struct Pbkit_Pingpong_Pong {
  public var a: String = String()

  public var unknownFields = SwiftProtobuf.UnknownStorage()

  public init() {}
}

#if swift(>=5.5) && canImport(_Concurrency)
extension Pbkit_Pingpong_Pong: @unchecked Sendable {}
#endif

extension Pbkit_Pingpong_Pong: SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = _protobuf_package + ".Pong"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    1: .same(proto: "a"),
  ]
}

extension Pbkit_Pingpong_Pong: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase {
  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      switch fieldNumber {
      case 1: try { try decoder.decodeSingularStringField(value: &self.a) }()
      default: break
      }
    }
  }
}

extension Pbkit_Pingpong_Pong {
  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    if self.a != String() {
      try visitor.visitSingularStringField(value: self.a, fieldNumber: 1)
    }
    try unknownFields.traverse(visitor: &visitor)
  }
}

extension Pbkit_Pingpong_Pong {
  public static func == (lhs: Pbkit_Pingpong_Pong, rhs: Pbkit_Pingpong_Pong) -> Bool {
    if lhs.a != rhs.a { return false }
    if lhs.unknownFields != rhs.unknownFields { return false }
    return true
  }
}
