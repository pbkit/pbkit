import SwiftProtobuf
import Foundation

fileprivate let _protobuf_package = ""
fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

public struct TypeMessage {
  public var unknownFields = SwiftProtobuf.UnknownStorage()

  public init() {}
}

#if swift(>=5.5) && canImport(_Concurrency)
extension TypeMessage: @unchecked Sendable {}
#endif

extension TypeMessage: SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = _protobuf_package + ".Type"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [:]
}

extension TypeMessage: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase {
  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      switch fieldNumber {
      default: break
      }
    }
  }
}

extension TypeMessage {
  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    try unknownFields.traverse(visitor: &visitor)
  }
}

extension TypeMessage {
  public static func == (lhs: TypeMessage, rhs: TypeMessage) -> Bool {
    if lhs.unknownFields != rhs.unknownFields { return false }
    return true
  }
}
