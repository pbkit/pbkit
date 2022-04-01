import SwiftProtobuf
import Foundation

fileprivate let _protobuf_package = "pbkit.pingpong"
fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

extension Pbkit_Pingpong_Ping.Yahoo {
  public struct TripleNested {
    public var unknownFields = SwiftProtobuf.UnknownStorage()

    public init() {}
  }
}

#if swift(>=5.5) && canImport(_Concurrency)
extension Pbkit_Pingpong_Ping.Yahoo.TripleNested: @unchecked Sendable {}
#endif

extension Pbkit_Pingpong_Ping.Yahoo.TripleNested: SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = _protobuf_package + ".TripleNested"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
  ]
}

extension Pbkit_Pingpong_Ping.Yahoo.TripleNested: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase {
  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      switch fieldNumber {
      default: break
      }
    }
  }
}

extension Pbkit_Pingpong_Ping.Yahoo.TripleNested: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase {
  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    try unknownFields.traverse(visitor: &visitor)
    }
  }
}

extension Pbkit_Pingpong_Ping.Yahoo.TripleNested {
  public static func == (lhs: Pbkit_Pingpong_Ping.Yahoo.TripleNested, rhs: Pbkit_Pingpong_Ping.Yahoo.TripleNested) -> Bool {
    if lhs.unknownFields != rhs.unknownFields { return false }
    return true
  }
}
