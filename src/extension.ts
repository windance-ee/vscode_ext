import * as vscode from 'vscode';

const tokenTypes = new Map<string, number>();
const tokenModifiers = new Map<string, number>();

const legend = (function () {
	const tokenTypesLegend = [
		'comment', 'string', 'keyword', 'number', 'regexp', 'operator', 'namespace',
		'type', 'struct', 'class', 'interface', 'enum', 'typeParameter', 'function',
		'method', 'decorator', 'macro', 'variable', 'parameter', 'property', 'label'
	];
	tokenTypesLegend.forEach((tokenType, index) => tokenTypes.set(tokenType, index));

	const tokenModifiersLegend = [
		'declaration', 'documentation', 'readonly', 'static', 'abstract', 'deprecated',
		'modification', 'async'
	];
	tokenModifiersLegend.forEach((tokenModifier, index) => tokenModifiers.set(tokenModifier, index));

	return new vscode.SemanticTokensLegend(tokenTypesLegend, tokenModifiersLegend);
})();

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider({ language: 'verilog'}, new DocumentSemanticTokensProvider(), legend));
}

interface IParsedToken {
	line: number;
	startCharacter: number;
	length: number;
	tokenType: string;
	tokenModifiers: string[];
}

class DocumentSemanticTokensProvider implements vscode.DocumentSemanticTokensProvider {
	async provideDocumentSemanticTokens(document: vscode.TextDocument, token: vscode.CancellationToken): Promise<vscode.SemanticTokens> {
		const allTokens = this._parseText(document.getText());
		const builder = new vscode.SemanticTokensBuilder();
		allTokens.forEach((token) => {
			builder.push(token.line, token.startCharacter, token.length, this._encodeTokenType(token.tokenType), this._encodeTokenModifiers(token.tokenModifiers));
		});
		return builder.build();
	}

	private _encodeTokenType(tokenType: string): number {
		if (tokenTypes.has(tokenType)) {
			return tokenTypes.get(tokenType)!;
		} else if (tokenType === 'notInLegend') {
			return tokenTypes.size + 2;
		}
		return 0;
	}

	private _encodeTokenModifiers(strTokenModifiers: string[]): number {
		let result = 0;
		for (let i = 0; i < strTokenModifiers.length; i++) {
			const tokenModifier = strTokenModifiers[i];
			if (tokenModifiers.has(tokenModifier)) {
				result = result | (1 << tokenModifiers.get(tokenModifier)!);
			} else if (tokenModifier === 'notInLegend') {
				result = result | (1 << tokenModifiers.size + 2);
			}
		}
		return result;
	}

	private _parseText(text: string): IParsedToken[] {
		const r: IParsedToken[] = [];
		const lines = text.split(/\r\n|\r|\n/);

		let module_state = 0;
		let python_pair = 0;
		let protect_pair;
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			let currentOffset = 0;

			let line_len = line.length;
			let line_end = 0;
			let ana_case = 0;
			let sub_line = line;
			var keyword_str;
			var openOffset;
			var closeOffset;
			do {
				if ((module_state == 0) && (line_end == 0))
				{
					switch(ana_case){
						case 2:
							//sub_line = line.substring(currentOffset-1,line_len);
							openOffset = currentOffset;
							closeOffset = line_len;
							currentOffset = closeOffset;
							r.push({
								line: i,
								startCharacter: openOffset,
								length: line_len-openOffset,
								tokenType: 'operator',
								tokenModifiers: ['declaration']
							});
							line_end = 1;
							break;
						case 1:
							sub_line = line.substring(currentOffset-1,line_len);
							if(sub_line.search(/^\s*(dff|reg)\s+/) != -1) { 
							// Match 3 char
								keyword_str = sub_line.match(/(dff|reg)/);
								if (keyword_str != null)
								{
									openOffset = sub_line.indexOf(keyword_str[0]) + currentOffset - 1;
								}
								else
								{
									openOffset = 0;
									ana_case = 2;
									break;
								}
								//const openOffset = sub_line.indexOf('inst') + currentOffset - 1;
								closeOffset = openOffset + 4;
								currentOffset = closeOffset;
								r.push({
									line: i,
									startCharacter: openOffset,
									length: 4,
									tokenType: 'macro',
									tokenModifiers: ['declaration']
								});
								ana_case = 2;
							}
							else if(sub_line.search(/^\s*(inst)\s+/) != -1) { 
							// Match inst
								keyword_str = sub_line.match(/(inst)/);
								if (keyword_str != null)
								{
									openOffset = sub_line.indexOf(keyword_str[0]) + currentOffset - 1;
								}
								else
								{
									openOffset = 0;
									ana_case = 2;
									break;
								}
								//const openOffset = sub_line.indexOf('inst') + currentOffset - 1;
								closeOffset = openOffset + 4;
								currentOffset = closeOffset;
								r.push({
									line: i,
									startCharacter: openOffset,
									length: 4,
									tokenType: 'class',
									tokenModifiers: ['declaration']
								});
								ana_case = 2;
							}
							else if(sub_line.search(/^\s*(conn|wire|comb)\s+/) != -1) { 
							// Match 4 char
								keyword_str = sub_line.match(/(conn|wire|comb)/);
								if (keyword_str != null)
								{
									openOffset = sub_line.indexOf(keyword_str[0]) + currentOffset - 1;
								}
								else
								{
									openOffset = 0;
									ana_case = 2;
									break;
								}
								//const openOffset = sub_line.indexOf('inst') + currentOffset - 1;
								closeOffset = openOffset + 4;
								currentOffset = closeOffset;
								r.push({
									line: i,
									startCharacter: openOffset,
									length: 4,
									tokenType: 'macro',
									tokenModifiers: ['declaration']
								});
								ana_case = 2;
							}
							else if(sub_line.search(/^\s*(param|direc|input|dffnn|dffpn|dffpp|dffnp)\s+/) != -1) { 
							// Match 5 char
								keyword_str = sub_line.match(/(param|direc|input|dffnn|dffpn|dffpp|dffnp)/);
								if (keyword_str != null)
								{
									openOffset = sub_line.indexOf(keyword_str[0]) + currentOffset - 1;
								}
								else
								{
									openOffset = 0;
									ana_case = 2;
									break;
								}
								//const openOffset = sub_line.indexOf('inst') + currentOffset - 1;
								closeOffset = openOffset + 5;
								currentOffset = closeOffset;
								r.push({
									line: i,
									startCharacter: openOffset,
									length: 5,
									tokenType: 'macro',
									tokenModifiers: ['declaration']
								});
								ana_case = 2;
							}
							else if(sub_line.search(/^\s*(output|assign)\s+/) != -1) { 
							// Match 6 char
								keyword_str = sub_line.match(/(output|assign)/);
								if (keyword_str != null)
								{
									openOffset = sub_line.indexOf(keyword_str[0]) + currentOffset - 1;
								}
								else
								{
									openOffset = 0;
									ana_case = 2;
									break;
								}
								//const openOffset = sub_line.indexOf('inst') + currentOffset - 1;
								closeOffset = openOffset + 6;
								currentOffset = closeOffset;
								r.push({
									line: i,
									startCharacter: openOffset,
									length: 6,
									tokenType: 'macro',
									tokenModifiers: ['declaration']
								});
								ana_case = 2;
							}
							else if(sub_line.search(/^\s*(python)\s+(start|end)\s*$/) != -1) { 
							// Match python
								if(sub_line.search(/(start)/) != -1) { 
								// Match start
									r.push({line: i,startCharacter: currentOffset,length: sub_line.length,tokenType: 'operator',tokenModifiers: ['async']});
									python_pair = r.length;
								}
								else{ 
								// Match end
									if(python_pair != 0)
									{
										r.push({line: i,startCharacter: currentOffset,length: sub_line.length,tokenType: 'macro',tokenModifiers: ['modification']});
										r[python_pair-1].tokenType = 'macro'
										python_pair = 0;
									}
									else
									{
										r.push({line: i,startCharacter: currentOffset,length: sub_line.length,tokenType: 'operator',tokenModifiers: ['deprecated']});
									}
								}

								line_end = 1;
							}
							else{
								openOffset = currentOffset;
								closeOffset = line_len;
								currentOffset = closeOffset;
								r.push({
									line: i,
									startCharacter: openOffset,
									length: line_len-openOffset,
									tokenType: 'function',
									tokenModifiers: ['declaration']
								});
								line_end = 1;

							}
							break;
						case 0:
							if(line.search(/^\s*module\s+/) == -1) { 
							// No match module
								if(line.search(/^\s*\/\/\s+brigates\s+/) == -1) { 
								// No match // brigates; break;
									line_end = 1;
									break;
								}
								else { 
								// Match // brigates 
									openOffset = line.indexOf('brigates');
									closeOffset = openOffset + 9;
									currentOffset = closeOffset;
									r.push({
										line: i,
										startCharacter: openOffset,
										length: 8,
										tokenType: 'keyword',
										tokenModifiers: ['declaration']
									});
									ana_case = 1;
								}
							}
							else { 
							// match module; break;
								module_state = 1;
							    line_end = 1;
								break;
							}
						default:
							break;
					}

				}
				else if((line_end == 0)){
					switch(ana_case){
						case 1:
							sub_line = line.substring(currentOffset-1,line_len);
							if(sub_line.search(/^\s*(protect)\s+(start|end)\s*$/) != -1) { 
							// Match python
								if(sub_line.search(/(start)/) != -1) { 
								// Match start
									r.push({line: i,startCharacter: currentOffset,length: sub_line.length,tokenType: 'operator',tokenModifiers: ['async']});
									python_pair = r.length;
								}
								else{ 
								// Match end
									if(python_pair != 0)
									{
										r.push({line: i,startCharacter: currentOffset,length: sub_line.length,tokenType: 'macro',tokenModifiers: ['modification']});
										r[python_pair-1].tokenType = 'macro'
										python_pair = 0;
									}
									else
									{
										r.push({line: i,startCharacter: currentOffset,length: sub_line.length,tokenType: 'operator',tokenModifiers: ['deprecated']});
									}
								}

								line_end = 1;
							}
							else{
								openOffset = currentOffset;
								closeOffset = line_len;
								currentOffset = closeOffset;
								r.push({
									line: i,
									startCharacter: openOffset,
									length: line_len-openOffset,
									tokenType: 'function',
									tokenModifiers: ['declaration']
								});
								line_end = 1;

							}
							break;
						case 0:
								if(line.search(/^\s*\/\/\s+brigates\s+/) == -1) { 
								// No match // brigates; break;
									line_end = 1;
									break;
								}
								else { 
								// Match // brigates 
									openOffset = line.indexOf('brigates');
									closeOffset = openOffset + 9;
									currentOffset = closeOffset;
									r.push({
										line: i,
										startCharacter: openOffset,
										length: 8,
										tokenType: 'keyword',
										tokenModifiers: ['declaration']
									});
									ana_case = 1;
								}
						default:
							break;
					}
				}
				else{
					break;
				}

				//break;
				//currentOffset = closeOffset;
			} while (true);
		}
		return r;
	}

	private _parseTextToken(text: string): { tokenType: string; tokenModifiers: string[]; } {
		const parts = text.split('.');
		return {
			tokenType: parts[0],
			tokenModifiers: parts.slice(1)
		};
	}
}
