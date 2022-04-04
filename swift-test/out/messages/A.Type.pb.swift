import SwiftProtobuf
import Foundation

fileprivate let _protobuf_package = ""
fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

extension A {
  public enum TypeEnum: SwiftProtobuf.Enum {
    public typealias RawValue = Int
    case a // = 0
    case b // = 1
    case self_ // = 2
    case UNRECOGNIZED(Int)
  
    public init() {
      self = .a
    }
  
    public init?(rawValue: Int) {
      switch rawValue {
      case 0: self = .a
      case 1: self = .b
      case 2: self = .self_
      default: self = .UNRECOGNIZED(rawValue)
      }
    }
  
    public var rawValue: Int {
      switch self {
      case .a: return 0
      case .b: return 1
      case .self_: return 2
      case .UNRECOGNIZED(let value): return value
      }
    }
  }
}

#if swift(>=4.2)

extension A.TypeEnum: CaseIterable {
  public static var allCases: [A.TypeEnum] {
    return [
      .a,
      .b,
      .self_,
    ]
  }
}

#endif

extension A.TypeEnum: SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = _protobuf_package + ".Type"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    0: .same(proto: "TYPE_A"),
    1: .same(proto: "TYPE_B"),
    2: .same(proto: "self"),
  ]
}

#if swift(>=5.5) && canImport(_Concurrency)
extension A.TypeEnum: @unchecked Sendable {}
#endif
