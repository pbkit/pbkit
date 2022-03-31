import SwiftProtobuf
import Foundation

fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

public struct Pbkit_Pingpong_Ping {
  public var babo: [Pbkit_Pingpong_Enum] = []

  public var merong: Pbkit_Pingpong_Enum = .abCDeF

  public var pongs: [Pbkit_Pingpong_Pong] = []

  public var strings: [String] = []

  public var int32S: [Int32] = []

  public var bytess: [Bytes] = []

  public var bools: [Bool] = []

  public var floats: [Float] = []

  public var doubles: [Double] = []

  public var maps: Dictionary<String, String> = [:]

  public var abcDefFf: Pbkit_Pingpong_Ping.OneOf_AbcDefFf? = nil

  public var a: String {
    get {
      if case .a(let v)? = abcDefFf {return v}
      return String
    }
    set {abcDefFf = .a(newValue)}
  }

  public var b: Int32 {
    get {
      if case .b(let v)? = abcDefFf {return v}
      return Int32
    }
    set {abcDefFf = .b(newValue)}
  }

  public enum OneOf_AbcDefFf: Equatable {
    case a(String)
    case b(Int32)

    #if !swift(>=4.1)
    public static func == (lhs: Pbkit_Pingpong_Ping.OneOf_AbcDefFf, rhs: Pbkit_Pingpong_Ping.OneOf_AbcDefFf) -> Bool {
      switch (lhs, rhs) {
      case (.a, .a): return {
        guard case .a(let l) = lhs, case .a(let r) = rhs else { preconditionFailure() }
        return l == r
      }()
      case (.b, .b): return {
        guard case .b(let l) = lhs, case .b(let r) = rhs else { preconditionFailure() }
        return l == r
      }()
      default:
        return false
      }
    }
    #endif
  }

  public var unknownFields = SwiftProtobuf.UnknownStorage()

  public init() {}
}
