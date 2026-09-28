%{
#include <stdio.h>
%}

%%
[a-zA-Z_][a-zA-Z0-9_]*   { printf("IDENTIFIER : %s\n", yytext); }
[ \t\n]+                ;
.                        ;
%%

int main() {
    yylex();
    return 0;
}

int yywrap() {
    return 1;
}
