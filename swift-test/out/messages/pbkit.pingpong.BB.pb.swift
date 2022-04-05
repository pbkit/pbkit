import SwiftProtobuf
import Foundation

fileprivate let _protobuf_package = "pbkit.pingpong"
fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

public struct Pbkit_Pingpong_BB {
  fileprivate var _aabCDeF: Pbkit_Pingpong_Pong? = nil

  public var aabCDeF: Pbkit_Pingpong_Pong {
    get {return _aabCDeF ?? Pbkit_Pingpong_Pong()}
    set {_aabCDeF = newValue}
  }

  public var hasAabCdeF: Bool {return self._aabCDeF != nil}

  public mutating func clearAabCdeF() {self._aabCDeF = nil}

  fileprivate var _description_p: Pbkit_Pingpong_Pong? = nil

  public var description_p: Pbkit_Pingpong_Pong {
    get {return _description_p ?? Pbkit_Pingpong_Pong()}
    set {_description_p = newValue}
  }

  public var hasDescriptionP: Bool {return self._description_p != nil}

  public mutating func clearDescriptionP() {self._description_p = nil}

  public var unknownFields = SwiftProtobuf.UnknownStorage()

  public init() {}
}

#if swift(>=5.5) && canImport(_Concurrency)
extension Pbkit_Pingpong_BB: @unchecked Sendable {}
#endif

extension Pbkit_Pingpong_BB: SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = _protobuf_package + ".BB"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    1: .same(proto: "aab_cDeF"),
    2: .same(proto: "description"),
  ]
}

extension Pbkit_Pingpong_BB: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase {
  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      switch fieldNumber {
      case 1: try { try decoder.decodeSingularMessageField(value: &self._aabCDeF) }()
      case 2: try { try decoder.decodeSingularMessageField(value: &self._description_p) }()
      default: break
      }
    }
  }
}

extension Pbkit_Pingpong_BB {
  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    try { if let v = self._aabCDeF {
      try visitor.visitSingularMessageField(value: v, fieldNumber: 1)
    } }()
    try { if let v = self._description_p {
      try visitor.visitSingularMessageField(value: v, fieldNumber: 2)
    } }()
    try unknownFields.traverse(visitor: &visitor)
  }
}

extension Pbkit_Pingpong_BB {
  public static func == (lhs: Pbkit_Pingpong_BB, rhs: Pbkit_Pingpong_BB) -> Bool {
    if lhs._aabCDeF != rhs._aabCDeF { return false }
    if lhs._description_p != rhs._description_p { return false }
    if lhs.unknownFields != rhs.unknownFields { return false }
    return true
  }
}
