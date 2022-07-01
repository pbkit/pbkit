import * as ast from "../ast/index.ts";
import { Token } from "../parser/recursive-descent-parser.ts";

export interface Visitor {
  visitProto: VisitFn<ast.Proto>;
  visitTopLevelStatement: VisitFn<ast.TopLevelStatement>;
  visitSyntax: VisitFn<ast.Syntax>;
  visitImport: VisitFn<ast.Import>;
  visitPackage: VisitFn<ast.Package>;
  visitOption: VisitFn<ast.Option>;
  visitOptionName: VisitFn<ast.OptionName>;
  visitOptionNameSegment: VisitFn<ast.OptionNameSegment>;
  visitTopLevelDef: VisitFn<ast.TopLevelDef>;
  visitMessage: VisitFn<ast.Message>;
  visitMessageBody: VisitFn<ast.MessageBody>;
  visitMessageBodyStatement: VisitFn<ast.MessageBodyStatement>;
  visitEnum: VisitFn<ast.Enum>;
  visitEnumBody: VisitFn<ast.EnumBody>;
  visitEnumBodyStatement: VisitFn<ast.EnumBodyStatement>;
  visitEnumField: VisitFn<ast.EnumField>;
  visitExtend: VisitFn<ast.Extend>;
  visitExtendBody: VisitFn<ast.ExtendBody>;
  visitExtendBodyStatement: VisitFn<ast.ExtendBodyStatement>;
  visitService: VisitFn<ast.Service>;
  visitServiceBody: VisitFn<ast.ServiceBody>;
  visitServiceBodyStatement: VisitFn<ast.ServiceBodyStatement>;
  visitRpc: VisitFn<ast.Rpc>;
  visitRpcBody: VisitFn<ast.RpcBody>;
  visitRpcBodyStatement: VisitFn<ast.RpcBodyStatement>;
  visitRpcType: VisitFn<ast.RpcType>;
  visitEmpty: VisitFn<ast.Empty>;
  visitField: VisitFn<ast.Field>;
  visitFieldOptions: VisitFn<ast.FieldOptions>;
  visitFieldOption: VisitFn<ast.FieldOption>;
  visitGroup: VisitFn<ast.Group>;
  visitOneof: VisitFn<ast.Oneof>;
  visitOneofBody: VisitFn<ast.OneofBody>;
  visitOneofBodyStatement: VisitFn<ast.OneofBodyStatement>;
  visitOneofField: VisitFn<ast.OneofField>;
  visitOneofGroup: VisitFn<ast.OneofGroup>;
  visitMalformedField: VisitFn<ast.MalformedField>;
  visitMapField: VisitFn<ast.MapField>;
  visitExtensions: VisitFn<ast.Extensions>;
  visitRanges: VisitFn<ast.Ranges>;
  visitRange: VisitFn<ast.Range>;
  visitMax: VisitFn<ast.Max>;
  visitReserved: VisitFn<ast.Reserved>;
  visitFieldNames: VisitFn<ast.FieldNames>;
  visitConstant: VisitFn<ast.Constant>;
  visitCommentGroup: VisitFn<ast.CommentGroup>;
  visitComment: VisitFn<ast.Comment>;
  visitSinglelineComment: VisitFn<ast.SinglelineComment>;
  visitMultilineComment: VisitFn<ast.MultilineComment>;
  visitKeyword: VisitFn<ast.Keyword>;
  visitType: VisitFn<ast.Type>;
  visitFullIdent: VisitFn<ast.FullIdent>;
  visitIntLit: VisitFn<ast.IntLit>;
  visitSignedIntLit: VisitFn<ast.SignedIntLit>;
  visitFloatLit: VisitFn<ast.FloatLit>;
  visitSignedFloatLit: VisitFn<ast.SignedFloatLit>;
  visitStrLit: VisitFn<ast.StrLit>;
  visitBoolLit: VisitFn<ast.BoolLit>;
  visitAggregate: VisitFn<ast.Aggregate>;
  visitIdent: VisitFn<ast.Ident>;
  visitDot: VisitFn<ast.Dot>;
  visitComma: VisitFn<ast.Comma>;
  visitSemi: VisitFn<ast.Semi>;
  visitToken: VisitFn<Token>;
}

export interface VisitFn<T> {
  (visitor: Visitor, node: T): void;
}

export const visitor: Visitor = {
  visitProto(visitor, node) {
    for (const statement of node.statements) {
      visitor.visitTopLevelStatement(visitor, statement);
    }
  },
  visitTopLevelStatement(visitor, node) {
    switch (node.type) {
      case "syntax":
        return visitor.visitSyntax(visitor, node);
      case "import":
        return visitor.visitImport(visitor, node);
      case "package":
        return visitor.visitPackage(visitor, node);
      case "option":
        return visitor.visitOption(visitor, node);
      case "message":
      case "enum":
      case "extend":
      case "service":
        return visitor.visitTopLevelDef(visitor, node);
      case "empty":
        return visitor.visitEmpty(visitor, node);
    }
  },
  visitSyntax(visitor, node) {
    visitStatementBase(visitor, node, () => {
      visitor.visitKeyword(visitor, node.keyword);
      visitor.visitToken(visitor, node.eq);
      visitor.visitToken(visitor, node.quoteOpen);
      visitor.visitToken(visitor, node.syntax);
      visitor.visitToken(visitor, node.quoteClose);
      visitor.visitSemi(visitor, node.semi);
    });
  },
  visitImport(visitor, node) {
    visitStatementBase(visitor, node, () => {
      visitor.visitKeyword(visitor, node.keyword);
      node.weakOrPublic && visitor.visitToken(visitor, node.weakOrPublic);
      visitor.visitStrLit(visitor, node.strLit);
      visitor.visitSemi(visitor, node.semi);
    });
  },
  visitPackage(visitor, node) {
    visitStatementBase(visitor, node, () => {
      visitor.visitKeyword(visitor, node.keyword);
      visitor.visitFullIdent(visitor, node.fullIdent);
      visitor.visitSemi(visitor, node.semi);
    });
  },
  visitOption(visitor, node) {
    visitStatementBase(visitor, node, () => {
      visitor.visitKeyword(visitor, node.keyword);
      visitor.visitOptionName(visitor, node.optionName);
      visitor.visitToken(visitor, node.eq);
      visitor.visitConstant(visitor, node.constant);
      visitor.visitSemi(visitor, node.semi);
    });
  },
  visitOptionName(visitor, node) {
    for (const optionNameSegmentOrDot of node.optionNameSegmentOrDots) {
      switch (optionNameSegmentOrDot.type) {
        case "option-name-segment":
          visitor.visitOptionNameSegment(visitor, optionNameSegmentOrDot);
          continue;
        case "dot":
          visitor.visitDot(visitor, optionNameSegmentOrDot);
          continue;
      }
    }
  },
  visitOptionNameSegment(visitor, node) {
    node.bracketOpen && visitor.visitToken(visitor, node.bracketOpen);
    visitor.visitFullIdent(visitor, node.name);
    node.bracketClose && visitor.visitToken(visitor, node.bracketClose);
  },
  visitTopLevelDef(visitor, node) {
    switch (node.type) {
      case "message":
        return visitor.visitMessage(visitor, node);
      case "enum":
        return visitor.visitEnum(visitor, node);
      case "extend":
        return visitor.visitExtend(visitor, node);
      case "service":
        return visitor.visitService(visitor, node);
    }
  },
  visitMessage(visitor, node) {
    visitStatementBase(visitor, node, () => {
      visitor.visitKeyword(visitor, node.keyword);
      visitor.visitToken(visitor, node.messageName);
      visitor.visitMessageBody(visitor, node.messageBody);
    });
  },
  visitMessageBody(visitor, node) {
    node.bracketOpen && visitor.visitToken(visitor, node.bracketOpen);
    for (const statement of node.statements) {
      visitor.visitMessageBodyStatement(visitor, statement);
    }
    node.bracketClose && visitor.visitToken(visitor, node.bracketClose);
  },
  visitMessageBodyStatement(visitor, node) {
    switch (node.type) {
      case "field":
        return visitor.visitField(visitor, node);
      case "malformed-field":
        return visitor.visitMalformedField(visitor, node);
      case "enum":
        return visitor.visitEnum(visitor, node);
      case "message":
        return visitor.visitMessage(visitor, node);
      case "extend":
        return visitor.visitExtend(visitor, node);
      case "extensions":
        return visitor.visitExtensions(visitor, node);
      case "group":
        return visitor.visitGroup(visitor, node);
      case "option":
        return visitor.visitOption(visitor, node);
      case "oneof":
        return visitor.visitOneof(visitor, node);
      case "map-field":
        return visitor.visitMapField(visitor, node);
      case "reserved":
        return visitor.visitReserved(visitor, node);
      case "empty":
        return visitor.visitEmpty(visitor, node);
    }
  },
  visitEnum(visitor, node) {
    visitStatementBase(visitor, node, () => {
      visitor.visitKeyword(visitor, node.keyword);
      visitor.visitToken(visitor, node.enumName);
      visitor.visitEnumBody(visitor, node.enumBody);
    });
  },
  visitEnumBody(visitor, node) {
    node.bracketOpen && visitor.visitToken(visitor, node.bracketOpen);
    for (const statement of node.statements) {
      visitor.visitEnumBodyStatement(visitor, statement);
    }
    node.bracketClose && visitor.visitToken(visitor, node.bracketClose);
  },
  visitEnumBodyStatement(visitor, node) {
    switch (node.type) {
      case "option":
        return visitor.visitOption(visitor, node);
      case "reserved":
        return visitor.visitReserved(visitor, node);
      case "enum-field":
        return visitor.visitEnumField(visitor, node);
      case "empty":
        return visitor.visitEmpty(visitor, node);
    }
  },
  visitEnumField(visitor, node) {
    visitStatementBase(visitor, node, () => {
      visitor.visitToken(visitor, node.fieldName);
      visitor.visitToken(visitor, node.eq);
      visitor.visitSignedIntLit(visitor, node.fieldNumber);
      node.fieldOptions &&
        visitor.visitFieldOptions(visitor, node.fieldOptions);
      visitor.visitSemi(visitor, node.semi);
    });
  },
  visitExtend(visitor, node) {
    visitStatementBase(visitor, node, () => {
      visitor.visitKeyword(visitor, node.keyword);
      visitor.visitType(visitor, node.messageType);
      visitor.visitExtendBody(visitor, node.extendBody);
    });
  },
  visitExtendBody(visitor, node) {
    node.bracketOpen && visitor.visitToken(visitor, node.bracketOpen);
    for (const statement of node.statements) {
      visitor.visitExtendBodyStatement(visitor, statement);
    }
    node.bracketClose && visitor.visitToken(visitor, node.bracketClose);
  },
  visitExtendBodyStatement(visitor, node) {
    switch (node.type) {
      case "field":
        return visitor.visitField(visitor, node);
      case "group":
        return visitor.visitGroup(visitor, node);
      case "empty":
        return visitor.visitEmpty(visitor, node);
    }
  },
  visitService(visitor, node) {
    visitStatementBase(visitor, node, () => {
      visitor.visitKeyword(visitor, node.keyword);
      visitor.visitToken(visitor, node.serviceName);
      visitor.visitServiceBody(visitor, node.serviceBody);
    });
  },
  visitServiceBody(visitor, node) {
    node.bracketOpen && visitor.visitToken(visitor, node.bracketOpen);
    for (const statement of node.statements) {
      visitor.visitServiceBodyStatement(visitor, statement);
    }
    node.bracketClose && visitor.visitToken(visitor, node.bracketClose);
  },
  visitServiceBodyStatement(visitor, node) {
    switch (node.type) {
      case "option":
        return visitor.visitOption(visitor, node);
      case "rpc":
        return visitor.visitRpc(visitor, node);
      case "empty":
        return visitor.visitEmpty(visitor, node);
    }
  },
  visitRpc(visitor, node) {
    visitStatementBase(visitor, node, () => {
      visitor.visitKeyword(visitor, node.keyword);
      visitor.visitToken(visitor, node.rpcName);
      visitor.visitRpcType(visitor, node.reqType);
      visitor.visitToken(visitor, node.returns);
      visitor.visitRpcType(visitor, node.resType);
      if (node.semiOrRpcBody.type === "semi") {
        visitor.visitSemi(visitor, node.semiOrRpcBody);
      } else {
        visitor.visitRpcBody(visitor, node.semiOrRpcBody);
      }
    });
  },
  visitRpcBody(visitor, node) {
    node.bracketOpen && visitor.visitToken(visitor, node.bracketOpen);
    for (const statement of node.statements) {
      visitor.visitRpcBodyStatement(visitor, statement);
    }
    node.bracketClose && visitor.visitToken(visitor, node.bracketClose);
  },
  visitRpcBodyStatement(visitor, node) {
    switch (node.type) {
      case "option":
        return visitor.visitOption(visitor, node);
      case "empty":
        return visitor.visitEmpty(visitor, node);
    }
  },
  visitRpcType(visitor, node) {
    visitor.visitToken(visitor, node.bracketOpen);
    node.stream && visitor.visitKeyword(visitor, node.stream);
    visitor.visitType(visitor, node.messageType);
    visitor.visitToken(visitor, node.bracketClose);
  },
  visitEmpty(visitor, node) {
    visitStatementBase(visitor, node, () => {
      visitor.visitSemi(visitor, node.semi);
    });
  },
  visitField(visitor, node) {
    visitStatementBase(visitor, node, () => {
      node.fieldLabel && visitor.visitKeyword(visitor, node.fieldLabel);
      visitor.visitType(visitor, node.fieldType);
      visitor.visitToken(visitor, node.fieldName);
      visitor.visitToken(visitor, node.eq);
      visitor.visitIntLit(visitor, node.fieldNumber);
      node.fieldOptions &&
        visitor.visitFieldOptions(visitor, node.fieldOptions);
      visitor.visitSemi(visitor, node.semi);
    });
  },
  visitFieldOptions(visitor, node) {
    visitor.visitToken(visitor, node.bracketOpen);
    for (const fieldOptionOrComma of node.fieldOptionOrCommas) {
      switch (fieldOptionOrComma.type) {
        case "field-option":
          visitor.visitFieldOption(visitor, fieldOptionOrComma);
          continue;
        case "comma":
          visitor.visitComma(visitor, fieldOptionOrComma);
          continue;
      }
    }
    visitor.visitToken(visitor, node.bracketClose);
  },
  visitFieldOption(visitor, node) {
    visitor.visitOptionName(visitor, node.optionName);
    visitor.visitToken(visitor, node.eq);
    visitor.visitConstant(visitor, node.constant);
  },
  visitGroup(visitor, node) {
    visitStatementBase(visitor, node, () => {
      visitor.visitKeyword(visitor, node.groupLabel);
      visitor.visitKeyword(visitor, node.keyword);
      visitor.visitToken(visitor, node.groupName);
      visitor.visitToken(visitor, node.eq);
      visitor.visitIntLit(visitor, node.fieldNumber);
      node.fieldOptions &&
        visitor.visitFieldOptions(visitor, node.fieldOptions);
      visitor.visitMessageBody(visitor, node.messageBody);
    });
  },
  visitOneof(visitor, node) {
    visitStatementBase(visitor, node, () => {
      visitor.visitKeyword(visitor, node.keyword);
      visitor.visitToken(visitor, node.oneofName);
      visitor.visitOneofBody(visitor, node.oneofBody);
    });
  },
  visitOneofBody(visitor, node) {
    node.bracketOpen && visitor.visitToken(visitor, node.bracketOpen);
    for (const statement of node.statements) {
      visitor.visitOneofBodyStatement(visitor, statement);
    }
    node.bracketClose && visitor.visitToken(visitor, node.bracketClose);
  },
  visitOneofBodyStatement(visitor, node) {
    switch (node.type) {
      case "option":
        return visitor.visitOption(visitor, node);
      case "oneof-field":
        return visitor.visitOneofField(visitor, node);
      case "empty":
        return visitor.visitEmpty(visitor, node);
    }
  },
  visitOneofField(visitor, node) {
    visitStatementBase(visitor, node, () => {
      visitor.visitType(visitor, node.fieldType);
      visitor.visitToken(visitor, node.fieldName);
      visitor.visitToken(visitor, node.eq);
      visitor.visitIntLit(visitor, node.fieldNumber);
      node.fieldOptions &&
        visitor.visitFieldOptions(visitor, node.fieldOptions);
      visitor.visitSemi(visitor, node.semi);
    });
  },
  visitOneofGroup(visitor, node) {
    visitStatementBase(visitor, node, () => {
      visitor.visitKeyword(visitor, node.keyword);
      visitor.visitToken(visitor, node.groupName);
      visitor.visitToken(visitor, node.eq);
      visitor.visitIntLit(visitor, node.fieldNumber);
      visitor.visitMessageBody(visitor, node.messageBody);
    });
  },
  visitMalformedField(visitor, node) {
    visitStatementBase(visitor, node, () => {
      node.fieldLabel && visitor.visitKeyword(visitor, node.fieldLabel);
      visitor.visitType(visitor, node.fieldType);
      node.fieldName && visitor.visitToken(visitor, node.fieldName);
      node.eq && visitor.visitToken(visitor, node.eq);
      node.fieldNumber && visitor.visitIntLit(visitor, node.fieldNumber);
      node.fieldOptions &&
        visitor.visitFieldOptions(visitor, node.fieldOptions);
      node.semi && visitor.visitSemi(visitor, node.semi);
    });
  },
  visitMapField(visitor, node) {
    visitStatementBase(visitor, node, () => {
      visitor.visitKeyword(visitor, node.keyword);
      visitor.visitToken(visitor, node.typeBracketOpen);
      visitor.visitType(visitor, node.keyType);
      visitor.visitToken(visitor, node.typeSep);
      visitor.visitType(visitor, node.valueType);
      visitor.visitToken(visitor, node.typeBracketClose);
      visitor.visitToken(visitor, node.mapName);
      visitor.visitToken(visitor, node.eq);
      visitor.visitIntLit(visitor, node.fieldNumber);
      node.fieldOptions &&
        visitor.visitFieldOptions(visitor, node.fieldOptions);
      visitor.visitSemi(visitor, node.semi);
    });
  },
  visitExtensions(visitor, node) {
    visitStatementBase(visitor, node, () => {
      visitor.visitKeyword(visitor, node.keyword);
      visitor.visitRanges(visitor, node.ranges);
      visitor.visitSemi(visitor, node.semi);
    });
  },
  visitRanges(visitor, node) {
    for (const rangeOrComma of node.rangeOrCommas) {
      switch (rangeOrComma.type) {
        case "range":
          visitor.visitRange(visitor, rangeOrComma);
          continue;
        case "comma":
          visitor.visitComma(visitor, rangeOrComma);
          continue;
      }
    }
  },
  visitRange(visitor, node) {
    visitor.visitIntLit(visitor, node.rangeStart);
    node.to && visitor.visitKeyword(visitor, node.to);
    if (node.rangeEnd) {
      switch (node.rangeEnd.type) {
        case "int-lit":
          visitor.visitIntLit(visitor, node.rangeEnd);
          break;
        case "max":
          visitor.visitMax(visitor, node.rangeEnd);
          break;
      }
    }
  },
  visitMax(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitReserved(visitor, node) {
    visitStatementBase(visitor, node, () => {
      visitor.visitKeyword(visitor, node.keyword);
      switch (node.reserved.type) {
        case "ranges":
          visitor.visitRanges(visitor, node.reserved);
          break;
        case "field-names":
          visitor.visitFieldNames(visitor, node.reserved);
          break;
      }
      visitor.visitSemi(visitor, node.semi);
    });
  },
  visitFieldNames(visitor, node) {
    for (const strLitOrComma of node.strLitOrCommas) {
      switch (strLitOrComma.type) {
        case "str-lit":
          visitor.visitStrLit(visitor, strLitOrComma);
          continue;
        case "comma":
          visitor.visitComma(visitor, strLitOrComma);
          continue;
      }
    }
  },
  visitConstant(visitor, node) {
    switch (node.type) {
      case "full-ident":
        return visitor.visitFullIdent(visitor, node);
      case "signed-int-lit":
        return visitor.visitSignedIntLit(visitor, node);
      case "signed-float-lit":
        return visitor.visitSignedFloatLit(visitor, node);
      case "str-lit":
        return visitor.visitStrLit(visitor, node);
      case "bool-lit":
        return visitor.visitBoolLit(visitor, node);
      case "aggregate":
        return visitor.visitAggregate(visitor, node);
    }
  },
  visitCommentGroup(visitor, node) {
    for (const comment of node.comments) {
      visitor.visitComment(visitor, comment);
    }
  },
  visitComment(visitor, node) {
    switch (node.type) {
      case "singleline-comment":
        return visitor.visitSinglelineComment(visitor, node);
      case "multiline-comment":
        return visitor.visitMultilineComment(visitor, node);
    }
  },
  visitSinglelineComment(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitMultilineComment(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitKeyword(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitType(visitor, node) {
    for (const identOrDot of node.identOrDots) {
      switch (identOrDot.type) {
        case "ident":
          visitor.visitIdent(visitor, identOrDot);
          continue;
        case "dot":
          visitor.visitDot(visitor, identOrDot);
          continue;
      }
    }
  },
  visitFullIdent(visitor, node) {
    for (const identOrDot of node.identOrDots) {
      switch (identOrDot.type) {
        case "ident":
          visitor.visitIdent(visitor, identOrDot);
          continue;
        case "dot":
          visitor.visitDot(visitor, identOrDot);
          continue;
      }
    }
  },
  visitIntLit(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitSignedIntLit(visitor, node) {
    node.sign && visitor.visitToken(visitor, node.sign);
    visitor.visitIntLit(visitor, node.value);
  },
  visitFloatLit(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitSignedFloatLit(visitor, node) {
    node.sign && visitor.visitToken(visitor, node.sign);
    visitor.visitFloatLit(visitor, node.value);
  },
  visitStrLit(visitor, node) {
    for (const token of node.tokens) {
      visitor.visitToken(visitor, token);
    }
  },
  visitBoolLit(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitAggregate() {},
  visitIdent(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitDot(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitComma(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitSemi(visitor, node) {
    visitor.visitToken(visitor, node);
  },
  visitToken() {},
};

export function visitStatementBase<T extends ast.StatementBase>(
  visitor: Visitor,
  node: T,
  visit: () => void,
): void {
  for (const commentGroup of node.leadingDetachedComments) {
    visitor.visitCommentGroup(visitor, commentGroup);
  }
  for (const commentGroup of node.leadingComments) {
    visitor.visitCommentGroup(visitor, commentGroup);
  }
  visit();
  for (const commentGroup of node.trailingComments) {
    visitor.visitCommentGroup(visitor, commentGroup);
  }
}
