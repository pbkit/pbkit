import GRPC
import NIO
import SwiftProtobuf

public protocol Pbkit_Pingpong_ExampleServiceClientProtocol: GRPCClient {
  var serviceName: String { get }
  var interceptors: Pbkit_Pingpong_ExampleServiceClientInterceptorFactoryProtocol? { get }

  func pingPong(
    _ request: Pbkit_Pingpong_BB,
    callOptions: CallOptions?
  ) -> UnaryCall<Pbkit_Pingpong_BB, Pbkit_Pingpong_BB>

  func pingPong2(
    _ request: Pbkit_Pingpong_BB,
    callOptions: CallOptions?
  ) -> UnaryCall<Pbkit_Pingpong_BB, Pbkit_Pingpong_A>
}

extension Pbkit_Pingpong_ExampleServiceClientProtocol {
  public var serviceName: String {
    return "pbkit.pingpong.ExampleService"
  }

  public func pingPong(
    _ request: Pbkit_Pingpong_BB,
    callOptions: CallOptions? = nil
  ) -> UnaryCall<Pbkit_Pingpong_BB, Pbkit_Pingpong_BB> {
    return self.makeUnaryCall(
      path: "/pbkit.pingpong.ExampleService/PingPong",
      request: request,
      callOptions: callOptions ?? self.defaultCallOptions,
      interceptors: self.interceptors?.makePingPongInterceptors() ?? []
    )
  }

  public func pingPong2(
    _ request: Pbkit_Pingpong_BB,
    callOptions: CallOptions? = nil
  ) -> UnaryCall<Pbkit_Pingpong_BB, Pbkit_Pingpong_A> {
    return self.makeUnaryCall(
      path: "/pbkit.pingpong.ExampleService/PingPong2",
      request: request,
      callOptions: callOptions ?? self.defaultCallOptions,
      interceptors: self.interceptors?.makePingPong2Interceptors() ?? []
    )
  }
}

public protocol Pbkit_Pingpong_ExampleServiceClientInterceptorFactoryProtocol {
  func makePingPongInterceptors() -> [ClientInterceptor<Pbkit_Pingpong_BB, Pbkit_Pingpong_BB>]

  func makePingPong2Interceptors() -> [ClientInterceptor<Pbkit_Pingpong_BB, Pbkit_Pingpong_A>]
}

public final class Pbkit_Pingpong_ExampleServiceClient: Pbkit_Pingpong_ExampleServiceClientProtocol {
  public let channel: GRPCChannel
  public var defaultCallOptions: CallOptions
  public var interceptors: Pbkit_Pingpong_ExampleServiceClientInterceptorFactoryProtocol?

  public init(
    channel: GRPCChannel,
    defaultCallOptions: CallOptions = CallOptions(),
    interceptors: Pbkit_Pingpong_ExampleServiceClientInterceptorFactoryProtocol? = nil
  ) {
    self.channel = channel
    self.defaultCallOptions = defaultCallOptions
    self.interceptors = interceptors
  }
}

public protocol Pbkit_Pingpong_ExampleServiceProvider: CallHandlerProvider {
  var interceptors: Pbkit_Pingpong_ExampleServiceServerInterceptorFactoryProtocol? { get }

  func pingPong(request: Pbkit_Pingpong_BB, context: StatusOnlyCallContext) -> EventLoopFuture<Pbkit_Pingpong_BB>

  func pingPong2(request: Pbkit_Pingpong_BB, context: StatusOnlyCallContext) -> EventLoopFuture<Pbkit_Pingpong_A>
}

extension Pbkit_Pingpong_ExampleServiceProvider {
  public var serviceName: Substring { return "pbkit.pingpong.ExampleService" }

  public func handle(
    method name: Substring,
    context: CallHandlerContext
  ) -> GRPCServerHandlerProtocol? {
    switch name {
    case "PingPong":
      return UnaryServerHandler(
        context: context,
        requestDeserializer: ProtobufDeserializer<Pbkit_Pingpong_BB>(),
        responseSerializer: ProtobufSerializer<Pbkit_Pingpong_BB>(),
        interceptors: self.interceptors?.makePingPongInterceptors() ?? [],
        userFunction: self.pingPong(request:context:)
      )

    case "PingPong2":
      return UnaryServerHandler(
        context: context,
        requestDeserializer: ProtobufDeserializer<Pbkit_Pingpong_BB>(),
        responseSerializer: ProtobufSerializer<Pbkit_Pingpong_A>(),
        interceptors: self.interceptors?.makePingPong2Interceptors() ?? [],
        userFunction: self.pingPong2(request:context:)
      )

    default:
      return nil
    }
  }
}

public protocol Pbkit_Pingpong_ExampleServiceServerInterceptorFactoryProtocol {
  func makePingPongInterceptors() -> [ServerInterceptor<Pbkit_Pingpong_BB, Pbkit_Pingpong_BB>]

  func makePingPong2Interceptors() -> [ServerInterceptor<Pbkit_Pingpong_BB, Pbkit_Pingpong_A>]
}
