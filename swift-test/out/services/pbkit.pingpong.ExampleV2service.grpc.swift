import GRPC
import NIO
import SwiftProtobuf

public protocol Pbkit_Pingpong_ExampleV2serviceClientProtocol: GRPCClient {
  var serviceName: String { get }
  var interceptors: Pbkit_Pingpong_ExampleV2serviceClientInterceptorFactoryProtocol? { get }
}

extension Pbkit_Pingpong_ExampleV2serviceClientProtocol {
  public var serviceName: String {
    return "pbkit.pingpong.ExampleV2service"
  }
}

public protocol Pbkit_Pingpong_ExampleV2serviceClientInterceptorFactoryProtocol {}

public final class Pbkit_Pingpong_ExampleV2serviceClient: Pbkit_Pingpong_ExampleV2serviceClientProtocol {
  public let channel: GRPCChannel
  public var defaultCallOptions: CallOptions
  public var interceptors: Pbkit_Pingpong_ExampleV2serviceClientInterceptorFactoryProtocol?

  public init(
    channel: GRPCChannel,
    defaultCallOptions: CallOptions = CallOptions(),
    interceptors: Pbkit_Pingpong_ExampleV2serviceClientInterceptorFactoryProtocol? = nil
  ) {
    self.channel = channel
    self.defaultCallOptions = defaultCallOptions
    self.interceptors = interceptors
  }
}

public protocol Pbkit_Pingpong_ExampleV2serviceProvider: CallHandlerProvider {
  var interceptors: Pbkit_Pingpong_ExampleV2serviceServerInterceptorFactoryProtocol? { get }
}

extension Pbkit_Pingpong_ExampleV2serviceProvider {
  public var serviceName: Substring { return "pbkit.pingpong.ExampleV2service" }

  public func handle(
    method name: Substring,
    context: CallHandlerContext
  ) -> GRPCServerHandlerProtocol? {
    switch name {
    default:
      return nil
    }
  }
}

public protocol Pbkit_Pingpong_ExampleV2serviceServerInterceptorFactoryProtocol {}
