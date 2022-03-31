import SwiftProtobuf
import Foundation

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
