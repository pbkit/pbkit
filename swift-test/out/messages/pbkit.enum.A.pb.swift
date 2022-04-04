import SwiftProtobuf
import Foundation

fileprivate let _protobuf_package = "pbkit.enum"
fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

public enum Pbkit_Enum_A: SwiftProtobuf.Enum {
  public typealias RawValue = Int
  case aBC // = 0
  case aCD // = 1
  case UNRECOGNIZED(Int)

  public init() {
    self = .aBC
  }

  public init?(rawValue: Int) {
    switch rawValue {
    case 0: self = .aBC
    case 1: self = .aCD
    default: self = .UNRECOGNIZED(rawValue)
    }
  }

  public var rawValue: Int {
    switch self {
    case .aBC: return 0
    case .aCD: return 1
    case .UNRECOGNIZED(let value): return value
    }
  }
}

#if swift(>=4.2)

extension Pbkit_Enum_A: CaseIterable {
  public static var allCases: [Pbkit_Enum_A] {
    return [
      .aBC,
      .aCD,
    ]
  }
}

#endif

extension Pbkit_Enum_A: SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = _protobuf_package + ".A"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    0: .same(proto: "A_B_C"),
    1: .same(proto: "A_C_D"),
  ]
}

#if swift(>=5.5) && canImport(_Concurrency)
extension Pbkit_Enum_A: @unchecked Sendable {}
#endif
