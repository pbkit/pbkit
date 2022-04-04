import SwiftProtobuf
import Foundation

fileprivate let _protobuf_package = "pbkit.enum"
fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

public enum Pbkit_Enum_AWESOME: SwiftProtobuf.Enum {
  public typealias RawValue = Int
  case bC // = 0
  case eCD // = 1
  case eF // = 2
  case UNRECOGNIZED(Int)

  public init() {
    self = .bC
  }

  public init?(rawValue: Int) {
    switch rawValue {
    case 0: self = .bC
    case 1: self = .eCD
    case 2: self = .eF
    default: self = .UNRECOGNIZED(rawValue)
    }
  }

  public var rawValue: Int {
    switch self {
    case .bC: return 0
    case .eCD: return 1
    case .eF: return 2
    case .UNRECOGNIZED(let value): return value
    }
  }
}

#if swift(>=4.2)

extension Pbkit_Enum_AWESOME: CaseIterable {
  public static var allCases: [Pbkit_Enum_AWESOME] {
    return [
      .bC,
      .eCD,
      .eF,
    ]
  }
}

#endif

extension Pbkit_Enum_AWESOME: SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = _protobuf_package + ".AWESOME"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    0: .same(proto: "A_WE_SOME_B_C"),
    1: .same(proto: "AWESOMEE_C_D"),
    2: .same(proto: "AWESOME_E_F"),
  ]
}

#if swift(>=5.5) && canImport(_Concurrency)
extension Pbkit_Enum_AWESOME: @unchecked Sendable {}
#endif
