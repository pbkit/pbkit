import SwiftProtobuf
import Foundation

fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

public struct Pbkit_Pingpong_BB {
  public var a: Pbkit_Pingpong_Pong

  public var unknownFields = SwiftProtobuf.UnknownStorage()

  public init() {}
}
