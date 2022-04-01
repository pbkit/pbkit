import SwiftProtobuf
import Foundation

fileprivate let _protobuf_package = "pbkit.pingpong"
fileprivate struct _GeneratedWithProtocGenSwiftVersion: SwiftProtobuf.ProtobufAPIVersionCheck {
  struct _2: SwiftProtobuf.ProtobufAPIVersion_2 {}
  typealias Version = _2
}

public struct Pbkit_Pingpong_Ping {
  public var babo: [Pbkit_Pingpong_Enum] = []

  public var merong: Pbkit_Pingpong_Enum = .abCDeF

  fileprivate var _pongs: Pbkit_Pingpong_Pong? = nil

  public var pongs: Pbkit_Pingpong_Pong {
    get {return _pongs ?? Pbkit_Pingpong_Pong()}
    set {_pongs = newValue}
  }

  public var hasPongs: Bool {return self._pongs != nil}

  public mutating func clearPongs() {self._pongs = nil}

  public var strings: [String] = []

  public var int32S: [Int32] = []

  public var bytess: [Data] = []

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

#if swift(>=5.5) && canImport(_Concurrency)
extension Pbkit_Pingpong_Ping: @unchecked Sendable {}
extension Pbkit_Pingpong_Ping.OneOf_AbcDefFf: @unchecked Sendable {}
#endif

extension Pbkit_Pingpong_Ping: SwiftProtobuf._ProtoNameProviding {
  public static let protoMessageName: String = _protobuf_package + ".Ping"
  public static let _protobuf_nameMap: SwiftProtobuf._NameMap = [
    1: .same(proto: "babo"),
    2: .same(proto: "merong"),
    3: .same(proto: "pongs"),
    4: .same(proto: "strings"),
    5: .same(proto: "int32s"),
    6: .same(proto: "bytess"),
    7: .same(proto: "bools"),
    8: .same(proto: "floats"),
    9: .same(proto: "doubles"),
    10: .same(proto: "a"),
    11: .same(proto: "b"),
    12: .same(proto: "maps"),
  ]
}

extension Pbkit_Pingpong_Ping: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase {
  public mutating func decodeMessage<D: SwiftProtobuf.Decoder>(decoder: inout D) throws {
    while let fieldNumber = try decoder.nextFieldNumber() {
      switch fieldNumber {
      case 1: try { try decoder.decodeRepeatedEnumField(value: &self.babo) }()
      case 2: try { try decoder.decodeSingularEnumField(value: &self.merong) }()
      case 3: try { try decoder.decodeSingularMessageField(value: &self.pongs) }()
      case 4: try { try decoder.decodeRepeatedStringField(value: &self.strings) }()
      case 5: try { try decoder.decodeRepeatedInt32Field(value: &self.int32S) }()
      case 6: try { try decoder.decodeRepeatedBytesField(value: &self.bytess) }()
      case 7: try { try decoder.decodeRepeatedBoolField(value: &self.bools) }()
      case 8: try { try decoder.decodeRepeatedFloatField(value: &self.floats) }()
      case 9: try { try decoder.decodeRepeatedDoubleField(value: &self.doubles) }()
      case 12: try { try decoder.decodeMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufString>.self, value: &self.maps) }()
      case 10: try {
        var v: String?
        try decoder.decodeSingularStringField(value: &v)
        if let v = v {
          if self.abcDefFf != nil {try decoder.handleConflictingOneOf()}
          self.abcDefFf = .a(v)
        }
      }()
      case 11: try {
        var v: Int32?
        try decoder.decodeSingularInt32Field(value: &v)
        if let v = v {
          if self.abcDefFf != nil {try decoder.handleConflictingOneOf()}
          self.abcDefFf = .b(v)
        }
      }()
      default: break
      }
    }
  }
}

extension Pbkit_Pingpong_Ping: SwiftProtobuf.Message, SwiftProtobuf._MessageImplementationBase {
  public func traverse<V: SwiftProtobuf.Visitor>(visitor: inout V) throws {
    if !self.babo.isEmpty {
      try visitor.visitPackedEnumField(value: self.babo, fieldNumber: 1)
    }
    if self.merong != .abCDeF {
      try visitor.visitSingularEnumField(value: self.merong, fieldNumber: 2)
    }
    try { if let v = self._pongs {
      try visitor.visitSingularMessageField(value: v, fieldNumber: 3)
    } }()
    if !self.strings.isEmpty {
      try visitor.visitPackedStringField(value: self.strings, fieldNumber: 4)
    }
    if !self.int32S.isEmpty {
      try visitor.visitPackedInt32Field(value: self.int32S, fieldNumber: 5)
    }
    if !self.bytess.isEmpty {
      try visitor.visitPackedBytesField(value: self.bytess, fieldNumber: 6)
    }
    if !self.bools.isEmpty {
      try visitor.visitPackedBoolField(value: self.bools, fieldNumber: 7)
    }
    if !self.floats.isEmpty {
      try visitor.visitPackedFloatField(value: self.floats, fieldNumber: 8)
    }
    if !self.doubles.isEmpty {
      try visitor.visitPackedDoubleField(value: self.doubles, fieldNumber: 9)
    }
    if !self.maps.isEmpty {
      try visitor.visitMapField(fieldType: SwiftProtobuf._ProtobufMap<SwiftProtobuf.ProtobufString, SwiftProtobuf.ProtobufString>.self, value: self.maps, fieldNumber: 12)
    }
    try unknownFields.traverse(visitor: &visitor)
  }
}
