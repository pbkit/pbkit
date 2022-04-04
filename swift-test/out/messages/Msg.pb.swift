import SwiftProtobuf
import Foundation

fileprivate let _protobuf_package = ""
fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

public struct Msg {
  public var unknownFields = SwiftProtobuf.UnknownStorage()

  public init() {}
}

#if swift(>=5.5) && canImport(_Concurrency)
extension Msg: @unchecked Sendable {}
#endif

extension Msg: SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = _protobuf_package + ".Msg"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [:]
}

extension Msg: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase {
  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      switch fieldNumber {
      default: break
      }
    }
  }
}

extension Msg {
  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    try unknownFields.traverse(visitor: &visitor)
  }
}

extension Msg {
  public static func == (lhs: Msg, rhs: Msg) -> Bool {
    if lhs.unknownFields != rhs.unknownFields { return false }
    return true
  }
}
