import SwiftProtobuf
import Foundation

fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

public enum Pbkit_Pingpong_Enum: SwiftProtobuf.Enum {
  public typealias RawValue = Int
  case abCDeF // = 0
  case bcDe // = 1
  case UNRECOGNIZED(Int)

  public init() {
    self = .abCDeF
  }

  public init?(rawValue: Int) {
    switch rawValue {
    case 0: self = .abCDeF
    case 1: self = .bcDe
    default: self = .UNRECOGNIZED(rawValue)
    }
  }

  public var rawValue: Int {
    switch self {
    case .abCDeF: return 0
    case .bcDe: return 1
    case .UNRECOGNIZED(let value): return value
    }
  }
}

#if swift(>=4.2)

extension Pbkit_Pingpong_Enum: CaseIterable {
  public static var allCases: [Pbkit_Pingpong_Enum] {
    return [
      .abCDeF,
      .bcDe,
    ]
  }
}

#endif

extension Pbkit_Pingpong_Enum: SwiftProtobuf._ProtoNameProviding {
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    0: .same(proto: "ab_cDeF"),
    1: .same(proto: "BcDE"),
  ]
}
