import * as tst from 'typescript-test-utils'
import { Leaf, UnwrapSyntheticLeavesDeeply } from "../src/static"





tst.assertTrue<tst.Equals<{ foo:Record<string,{bar:1}>}, UnwrapSyntheticLeavesDeeply<{ foo: Record<string,Leaf<{bar:1}>> }>>>()
tst.assertTrue<tst.Equals<{ foo?:Record<string,{bar:1}>}, UnwrapSyntheticLeavesDeeply<{ foo?: Record<string,Leaf<{bar:1}>> }>>>()
