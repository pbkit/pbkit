fileprivate let _protobuf_package = "pbkit.pingpong"
import SwiftProtobuf
import Foundation

fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

extension Pbkit_Pingpong_Ping {
  public enum ABC: SwiftProtobuf.Enum {
    public typealias RawValue = Int
    case bbba // = 0
    case bbbbb // = 1
    case UNRECOGNIZED(Int)
  
    public init() {
      self = .bbba
    }
  
    public init?(rawValue: Int) {
      switch rawValue {
      case 0: self = .bbba
      case 1: self = .bbbbb
      default: self = .UNRECOGNIZED(rawValue)
      }
    }
  
    public var rawValue: Int {
      switch self {
      case .bbba: return 0
      case .bbbbb: return 1
      case .UNRECOGNIZED(let value): return value
      }
    }
  }
}

#if swift(>=4.2)

extension Pbkit_Pingpong_Ping.ABC: CaseIterable {
  public static var allCases: [Pbkit_Pingpong_Ping.ABC] {
    return [
      .bbba,
      .bbbbb,
    ]
  }
}

#endif

extension Pbkit_Pingpong_Ping.ABC: SwiftProtobuf._ProtoNameProviding {
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    0: .same(proto: "bbba"),
    1: .same(proto: "bbbbb"),
  ]
}

#if swift(>=5.5) && canImport(_Concurrency)
extension Pbkit_Pingpong_Ping.ABC: @unchecked Sendable {}
#endif
