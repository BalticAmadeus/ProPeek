
define variable test as character init "ttt" no-undo.
{new.i}

message test.

define variable test11 as test1 no-undo.
test11 = new test1().
test11:get1().
{test.i}

message GET_SAME_CHAR(test).

message get_same_char2(test).