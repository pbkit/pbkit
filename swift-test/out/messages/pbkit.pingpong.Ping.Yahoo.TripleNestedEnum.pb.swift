import SwiftProtobuf
import Foundation

fileprivate let _protobuf_package = "pbkit.pingpong"
fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

extension Pbkit_Pingpong_Ping.Yahoo {
  public enum TripleNestedEnum: SwiftProtobuf.Enum {
    public typealias RawValue = Int
    case aa // = 0
    case UNRECOGNIZED(Int)
  
    public init() {
      self = .aa
    }
  
    public init?(rawValue: Int) {
      switch rawValue {
      case 0: self = .aa
      default: self = .UNRECOGNIZED(rawValue)
      }
    }
  
    public var rawValue: Int {
      switch self {
      case .aa: return 0
      case .UNRECOGNIZED(let value): return value
      }
    }
  }
}

#if swift(>=4.2)

extension Pbkit_Pingpong_Ping.Yahoo.TripleNestedEnum: CaseIterable {
  public static var allCases: [Pbkit_Pingpong_Ping.Yahoo.TripleNestedEnum] {
    return [
      .aa,
    ]
  }
}

#endif

extension Pbkit_Pingpong_Ping.Yahoo.TripleNestedEnum: SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = _protobuf_package + ".TripleNestedEnum"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    0: .same(proto: "aa"),
  ]
}

#if swift(>=5.5) && canImport(_Concurrency)
extension Pbkit_Pingpong_Ping.Yahoo.TripleNestedEnum: @unchecked Sendable {}
#endif
