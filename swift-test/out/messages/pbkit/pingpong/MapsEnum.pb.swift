fileprivate let _protobuf_package = "pbkit.pingpong"
import SwiftProtobuf
import Foundation

fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

public enum Pbkit_Pingpong_MapsEnum: SwiftProtobuf.Enum {
  public typealias RawValue = Int
  case a // = 0
  case UNRECOGNIZED(Int)

  public init() {
    self = .a
  }

  public init?(rawValue: Int) {
    switch rawValue {
    case 0: self = .a
    default: self = .UNRECOGNIZED(rawValue)
    }
  }

  public var rawValue: Int {
    switch self {
    case .a: return 0
    case .UNRECOGNIZED(let value): return value
    }
  }
}

#if swift(>=4.2)

extension Pbkit_Pingpong_MapsEnum: CaseIterable {
  public static var allCases: [Pbkit_Pingpong_MapsEnum] {
    return [
      .a,
    ]
  }
}

#endif

extension Pbkit_Pingpong_MapsEnum: SwiftProtobuf._ProtoNameProviding {
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    0: .same(proto: "a"),
  ]
}

#if swift(>=5.5) && canImport(_Concurrency)
extension Pbkit_Pingpong_MapsEnum: @unchecked Sendable {}
#endif
