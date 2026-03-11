(module
 (type $0 (func (param i32) (result i32)))
 (type $1 (func (param i32) (result f64)))
 (type $2 (func (param i32)))
 (type $3 (func (param i32 i32 i32 i32)))
 (type $4 (func (param i32 i32) (result i32)))
 (type $5 (func (result i32)))
 (type $6 (func (param i32 f64)))
 (type $7 (func (param i32 f64 f64 f64 i32)))
 (type $8 (func (param i32 f64 i32) (result i32)))
 (type $9 (func))
 (import "env" "abort" (func $~lib/builtins/abort (param i32 i32 i32 i32)))
 (global $~lib/rt/stub/offset (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gMarks (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gMarksKeys (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gMarksLen (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gActive (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gMarksCount (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gActiveCount (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gCIndex (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gCPos (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gLocalLen (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gStarted (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gCtxUsed (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gOutgoing (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gIncoming (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gOutCount (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gInCount (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gResultBuf (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gResultCount (mut i32) (i32.const 0))
 (memory $0 1)
 (data $0 (i32.const 1036) ",")
 (data $0.1 (i32.const 1048) "\02\00\00\00\1c\00\00\00I\00n\00v\00a\00l\00i\00d\00 \00l\00e\00n\00g\00t\00h")
 (data $1 (i32.const 1084) "<")
 (data $1.1 (i32.const 1096) "\02\00\00\00&\00\00\00~\00l\00i\00b\00/\00s\00t\00a\00t\00i\00c\00a\00r\00r\00a\00y\00.\00t\00s")
 (data $2 (i32.const 1148) "<")
 (data $2.1 (i32.const 1160) "\02\00\00\00(\00\00\00A\00l\00l\00o\00c\00a\00t\00i\00o\00n\00 \00t\00o\00o\00 \00l\00a\00r\00g\00e")
 (data $3 (i32.const 1212) "<")
 (data $3.1 (i32.const 1224) "\02\00\00\00\1e\00\00\00~\00l\00i\00b\00/\00r\00t\00/\00s\00t\00u\00b\00.\00t\00s")
 (export "createContext" (func $src/assembly/TweenAxisCore/createContext))
 (export "destroyContext" (func $src/assembly/TweenAxisCore/destroyContext))
 (export "resetContext" (func $src/assembly/TweenAxisCore/resetContext))
 (export "setLocalLength" (func $src/assembly/TweenAxisCore/setLocalLength))
 (export "getCurrentPos" (func $src/assembly/TweenAxisCore/getCurrentPos))
 (export "addProcess" (func $src/assembly/TweenAxisCore/addProcess))
 (export "goTo" (func $src/assembly/TweenAxisCore/goTo))
 (export "getResultPhase" (func $src/assembly/TweenAxisCore/getResultPhase))
 (export "getResultKey" (func $src/assembly/TweenAxisCore/getResultKey))
 (export "getResultPos" (func $src/assembly/TweenAxisCore/getResultPos))
 (export "getResultDelta" (func $src/assembly/TweenAxisCore/getResultDelta))
 (export "memory" (memory $0))
 (start $~start)
 (func $~lib/rt/stub/__new (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  local.get $0
  i32.const 1073741804
  i32.gt_u
  if
   i32.const 1168
   i32.const 1232
   i32.const 86
   i32.const 30
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  i32.const 16
  i32.add
  local.tee $4
  i32.const 1073741820
  i32.gt_u
  if
   i32.const 1168
   i32.const 1232
   i32.const 33
   i32.const 29
   call $~lib/builtins/abort
   unreachable
  end
  global.get $~lib/rt/stub/offset
  global.get $~lib/rt/stub/offset
  i32.const 4
  i32.add
  local.tee $2
  local.get $4
  i32.const 19
  i32.add
  i32.const -16
  i32.and
  i32.const 4
  i32.sub
  local.tee $4
  i32.add
  local.tee $5
  memory.size
  local.tee $6
  i32.const 16
  i32.shl
  i32.const 15
  i32.add
  i32.const -16
  i32.and
  local.tee $7
  i32.gt_u
  if
   local.get $6
   local.get $5
   local.get $7
   i32.sub
   i32.const 65535
   i32.add
   i32.const -65536
   i32.and
   i32.const 16
   i32.shr_u
   local.tee $7
   local.get $6
   local.get $7
   i32.gt_s
   select
   memory.grow
   i32.const 0
   i32.lt_s
   if
    local.get $7
    memory.grow
    i32.const 0
    i32.lt_s
    if
     unreachable
    end
   end
  end
  local.get $5
  global.set $~lib/rt/stub/offset
  local.get $4
  i32.store
  local.get $2
  i32.const 4
  i32.sub
  local.tee $3
  i32.const 0
  i32.store offset=4
  local.get $3
  i32.const 0
  i32.store offset=8
  local.get $3
  local.get $1
  i32.store offset=12
  local.get $3
  local.get $0
  i32.store offset=16
  local.get $2
  i32.const 16
  i32.add
 )
 (func $~lib/staticarray/StaticArray<f64>#constructor (param $0 i32) (result i32)
  (local $1 i32)
  local.get $0
  i32.const 134217727
  i32.gt_u
  if
   i32.const 1056
   i32.const 1104
   i32.const 51
   i32.const 60
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  i32.const 3
  i32.shl
  local.tee $0
  i32.const 4
  call $~lib/rt/stub/__new
  local.tee $1
  i32.const 0
  local.get $0
  memory.fill
  local.get $1
 )
 (func $~lib/staticarray/StaticArray<i32>#constructor (param $0 i32) (result i32)
  (local $1 i32)
  local.get $0
  i32.const 268435455
  i32.gt_u
  if
   i32.const 1056
   i32.const 1104
   i32.const 51
   i32.const 60
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  i32.const 2
  i32.shl
  local.tee $0
  i32.const 5
  call $~lib/rt/stub/__new
  local.tee $1
  i32.const 0
  local.get $0
  memory.fill
  local.get $1
 )
 (func $src/assembly/TweenAxisCore/createContext (result i32)
  (local $0 i32)
  (local $1 i32)
  (local $2 i32)
  loop $for-loop|0
   local.get $0
   i32.const 64
   i32.lt_s
   if
    local.get $0
    i32.const 2
    i32.shl
    local.tee $1
    global.get $src/assembly/TweenAxisCore/gCtxUsed
    i32.add
    local.tee $2
    i32.load
    i32.eqz
    if
     local.get $2
     i32.const 1
     i32.store
     global.get $src/assembly/TweenAxisCore/gMarksCount
     local.get $1
     i32.add
     i32.const 0
     i32.store
     global.get $src/assembly/TweenAxisCore/gActiveCount
     local.get $1
     i32.add
     i32.const 0
     i32.store
     global.get $src/assembly/TweenAxisCore/gCIndex
     local.get $1
     i32.add
     i32.const 0
     i32.store
     local.get $0
     i32.const 3
     i32.shl
     local.tee $2
     global.get $src/assembly/TweenAxisCore/gCPos
     i32.add
     f64.const 0
     f64.store
     global.get $src/assembly/TweenAxisCore/gLocalLen
     local.get $2
     i32.add
     f64.const 1
     f64.store
     global.get $src/assembly/TweenAxisCore/gStarted
     local.get $1
     i32.add
     i32.const 0
     i32.store
     local.get $0
     return
    end
    local.get $0
    i32.const 1
    i32.add
    local.set $0
    br $for-loop|0
   end
  end
  i32.const -1
 )
 (func $src/assembly/TweenAxisCore/destroyContext (param $0 i32)
  local.get $0
  i32.const 2
  i32.shl
  local.tee $0
  global.get $src/assembly/TweenAxisCore/gCtxUsed
  i32.add
  i32.const 0
  i32.store
  local.get $0
  global.get $src/assembly/TweenAxisCore/gMarksCount
  i32.add
  i32.const 0
  i32.store
  local.get $0
  global.get $src/assembly/TweenAxisCore/gActiveCount
  i32.add
  i32.const 0
  i32.store
 )
 (func $src/assembly/TweenAxisCore/resetContext (param $0 i32)
  (local $1 i32)
  local.get $0
  i32.const 2
  i32.shl
  local.tee $1
  global.get $src/assembly/TweenAxisCore/gMarksCount
  i32.add
  i32.const 0
  i32.store
  local.get $1
  global.get $src/assembly/TweenAxisCore/gActiveCount
  i32.add
  i32.const 0
  i32.store
  local.get $1
  global.get $src/assembly/TweenAxisCore/gCIndex
  i32.add
  i32.const 0
  i32.store
  local.get $0
  i32.const 3
  i32.shl
  local.tee $0
  global.get $src/assembly/TweenAxisCore/gCPos
  i32.add
  f64.const 0
  f64.store
  local.get $0
  global.get $src/assembly/TweenAxisCore/gLocalLen
  i32.add
  f64.const 1
  f64.store
  local.get $1
  global.get $src/assembly/TweenAxisCore/gStarted
  i32.add
  i32.const 0
  i32.store
 )
 (func $src/assembly/TweenAxisCore/setLocalLength (param $0 i32) (param $1 f64)
  global.get $src/assembly/TweenAxisCore/gLocalLen
  local.get $0
  i32.const 3
  i32.shl
  i32.add
  local.get $1
  f64.store
 )
 (func $src/assembly/TweenAxisCore/getCurrentPos (param $0 i32) (result f64)
  global.get $src/assembly/TweenAxisCore/gCPos
  local.get $0
  i32.const 3
  i32.shl
  i32.add
  f64.load
 )
 (func $src/assembly/TweenAxisCore/addProcess (param $0 i32) (param $1 f64) (param $2 f64) (param $3 f64) (param $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  (local $10 i32)
  local.get $0
  i32.const 9
  i32.shl
  local.set $8
  global.get $src/assembly/TweenAxisCore/gMarksCount
  local.get $0
  i32.const 2
  i32.shl
  i32.add
  i32.load
  local.set $6
  global.get $src/assembly/TweenAxisCore/gMarksLen
  local.get $0
  i32.const 8
  i32.shl
  local.get $4
  i32.add
  i32.const 3
  i32.shl
  i32.add
  local.get $3
  f64.store
  loop $while-continue|0
   local.get $6
   local.get $7
   i32.gt_s
   if (result i32)
    local.get $1
    global.get $src/assembly/TweenAxisCore/gMarks
    local.get $7
    local.get $8
    i32.add
    i32.const 3
    i32.shl
    i32.add
    f64.load
    f64.gt
   else
    i32.const 0
   end
   if
    local.get $7
    i32.const 1
    i32.add
    local.set $7
    br $while-continue|0
   end
  end
  local.get $6
  local.set $5
  loop $for-loop|1
   local.get $5
   local.get $7
   i32.gt_s
   if
    local.get $5
    local.get $8
    i32.add
    local.tee $9
    i32.const 1
    i32.sub
    local.set $10
    global.get $src/assembly/TweenAxisCore/gMarks
    local.get $9
    i32.const 3
    i32.shl
    i32.add
    global.get $src/assembly/TweenAxisCore/gMarks
    local.get $10
    i32.const 3
    i32.shl
    i32.add
    f64.load
    f64.store
    global.get $src/assembly/TweenAxisCore/gMarksKeys
    local.get $9
    i32.const 2
    i32.shl
    i32.add
    global.get $src/assembly/TweenAxisCore/gMarksKeys
    local.get $10
    i32.const 2
    i32.shl
    i32.add
    i32.load
    i32.store
    local.get $5
    i32.const 1
    i32.sub
    local.set $5
    br $for-loop|1
   end
  end
  global.get $src/assembly/TweenAxisCore/gMarks
  local.get $7
  local.get $8
  i32.add
  local.tee $5
  i32.const 3
  i32.shl
  i32.add
  local.get $1
  f64.store
  global.get $src/assembly/TweenAxisCore/gMarksKeys
  local.get $5
  i32.const 2
  i32.shl
  i32.add
  local.get $4
  i32.store
  local.get $6
  i32.const 1
  i32.add
  local.set $6
  local.get $7
  i32.const 1
  i32.add
  local.set $7
  loop $while-continue|2
   local.get $6
   local.get $7
   i32.gt_s
   if (result i32)
    local.get $2
    global.get $src/assembly/TweenAxisCore/gMarks
    local.get $7
    local.get $8
    i32.add
    i32.const 3
    i32.shl
    i32.add
    f64.load
    f64.ge
   else
    i32.const 0
   end
   if
    local.get $7
    i32.const 1
    i32.add
    local.set $7
    br $while-continue|2
   end
  end
  local.get $6
  local.set $5
  loop $for-loop|3
   local.get $5
   local.get $7
   i32.gt_s
   if
    local.get $5
    local.get $8
    i32.add
    local.tee $9
    i32.const 1
    i32.sub
    local.set $10
    global.get $src/assembly/TweenAxisCore/gMarks
    local.get $9
    i32.const 3
    i32.shl
    i32.add
    global.get $src/assembly/TweenAxisCore/gMarks
    local.get $10
    i32.const 3
    i32.shl
    i32.add
    f64.load
    f64.store
    global.get $src/assembly/TweenAxisCore/gMarksKeys
    local.get $9
    i32.const 2
    i32.shl
    i32.add
    global.get $src/assembly/TweenAxisCore/gMarksKeys
    local.get $10
    i32.const 2
    i32.shl
    i32.add
    i32.load
    i32.store
    local.get $5
    i32.const 1
    i32.sub
    local.set $5
    br $for-loop|3
   end
  end
  global.get $src/assembly/TweenAxisCore/gMarks
  local.get $7
  local.get $8
  i32.add
  local.tee $5
  i32.const 3
  i32.shl
  i32.add
  local.get $2
  f64.store
  global.get $src/assembly/TweenAxisCore/gMarksKeys
  local.get $5
  i32.const 2
  i32.shl
  i32.add
  i32.const 0
  local.get $4
  i32.sub
  i32.store
  global.get $src/assembly/TweenAxisCore/gMarksCount
  local.get $0
  i32.const 2
  i32.shl
  i32.add
  local.get $6
  i32.const 1
  i32.add
  i32.store
 )
 (func $src/assembly/TweenAxisCore/goTo (param $0 i32) (param $1 f64) (param $2 i32) (result i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 f64)
  (local $7 f64)
  (local $8 f64)
  (local $9 f64)
  (local $10 i32)
  (local $11 i32)
  (local $12 i32)
  (local $13 i32)
  (local $14 i32)
  (local $15 i32)
  (local $16 i32)
  (local $17 f64)
  (local $18 f64)
  local.get $0
  i32.const 2
  i32.shl
  local.tee $4
  global.get $src/assembly/TweenAxisCore/gStarted
  i32.add
  local.tee $5
  i32.load
  i32.eqz
  if
   local.get $5
   i32.const 1
   i32.store
   global.get $src/assembly/TweenAxisCore/gCIndex
   local.get $4
   i32.add
   i32.const 0
   i32.store
   global.get $src/assembly/TweenAxisCore/gCPos
   local.get $0
   i32.const 3
   i32.shl
   i32.add
   f64.const 0
   f64.store
  end
  local.get $0
  i32.const 9
  i32.shl
  local.set $11
  local.get $0
  i32.const 8
  i32.shl
  local.set $12
  local.get $0
  i32.const 2
  i32.shl
  local.tee $5
  global.get $src/assembly/TweenAxisCore/gMarksCount
  i32.add
  i32.load
  local.set $13
  global.get $src/assembly/TweenAxisCore/gCIndex
  local.get $5
  i32.add
  i32.load
  local.set $4
  local.get $1
  local.get $0
  i32.const 3
  i32.shl
  local.tee $10
  global.get $src/assembly/TweenAxisCore/gCPos
  i32.add
  f64.load
  local.tee $7
  f64.sub
  local.set $9
  global.get $src/assembly/TweenAxisCore/gLocalLen
  local.get $10
  i32.add
  f64.load
  local.set $8
  i32.const 0
  global.get $src/assembly/TweenAxisCore/gActiveCount
  local.get $5
  i32.add
  i32.load
  local.get $2
  select
  local.set $5
  i32.const 0
  global.set $src/assembly/TweenAxisCore/gOutCount
  i32.const 0
  global.set $src/assembly/TweenAxisCore/gInCount
  loop $while-continue|0
   local.get $4
   local.get $13
   i32.lt_s
   if (result i32)
    local.get $1
    global.get $src/assembly/TweenAxisCore/gMarks
    local.get $4
    local.get $11
    i32.add
    i32.const 3
    i32.shl
    i32.add
    f64.load
    f64.gt
   else
    i32.const 0
   end
   if (result i32)
    i32.const 1
   else
    local.get $4
    local.get $13
    i32.lt_s
    local.get $9
    f64.const 0
    f64.ge
    i32.and
    if (result i32)
     local.get $1
     global.get $src/assembly/TweenAxisCore/gMarks
     local.get $4
     local.get $11
     i32.add
     i32.const 3
     i32.shl
     i32.add
     f64.load
     f64.eq
    else
     i32.const 0
    end
   end
   if
    global.get $src/assembly/TweenAxisCore/gActive
    local.set $10
    i32.const 0
    global.get $src/assembly/TweenAxisCore/gMarksKeys
    local.get $4
    local.get $11
    i32.add
    i32.const 2
    i32.shl
    i32.add
    i32.load
    local.tee $14
    i32.sub
    local.set $15
    i32.const 0
    local.set $2
    block $__inlined_func$src/assembly/TweenAxisCore/indexOf$105
     loop $for-loop|0
      local.get $2
      local.get $5
      i32.lt_s
      if
       local.get $15
       local.get $10
       local.get $2
       local.get $12
       i32.add
       i32.const 2
       i32.shl
       i32.add
       i32.load
       i32.eq
       br_if $__inlined_func$src/assembly/TweenAxisCore/indexOf$105
       local.get $2
       i32.const 1
       i32.add
       local.set $2
       br $for-loop|0
      end
     end
     i32.const -1
     local.set $2
    end
    local.get $2
    i32.const -1
    i32.ne
    if
     global.get $src/assembly/TweenAxisCore/gActive
     local.set $10
     loop $for-loop|00
      local.get $2
      local.get $5
      i32.const 1
      i32.sub
      i32.lt_s
      if
       local.get $10
       local.get $2
       local.get $12
       i32.add
       local.tee $15
       i32.const 2
       i32.shl
       i32.add
       local.get $10
       local.get $15
       i32.const 1
       i32.add
       i32.const 2
       i32.shl
       i32.add
       i32.load
       i32.store
       local.get $2
       i32.const 1
       i32.add
       local.set $2
       br $for-loop|00
      end
     end
     local.get $5
     i32.const 1
     i32.sub
     local.set $5
     global.get $src/assembly/TweenAxisCore/gOutCount
     local.tee $2
     i32.const 1
     i32.add
     global.set $src/assembly/TweenAxisCore/gOutCount
     global.get $src/assembly/TweenAxisCore/gOutgoing
     local.get $2
     i32.const 2
     i32.shl
     i32.add
     local.get $14
     i32.store
    else
     global.get $src/assembly/TweenAxisCore/gActive
     local.set $10
     i32.const 0
     local.set $2
     block $__inlined_func$src/assembly/TweenAxisCore/indexOf$107
      loop $for-loop|01
       local.get $2
       local.get $5
       i32.lt_s
       if
        local.get $14
        local.get $10
        local.get $2
        local.get $12
        i32.add
        i32.const 2
        i32.shl
        i32.add
        i32.load
        i32.eq
        br_if $__inlined_func$src/assembly/TweenAxisCore/indexOf$107
        local.get $2
        i32.const 1
        i32.add
        local.set $2
        br $for-loop|01
       end
      end
      i32.const -1
      local.set $2
     end
     local.get $2
     i32.const -1
     i32.ne
     if
      global.get $src/assembly/TweenAxisCore/gActive
      local.set $10
      loop $for-loop|03
       local.get $2
       local.get $5
       i32.const 1
       i32.sub
       i32.lt_s
       if
        local.get $10
        local.get $2
        local.get $12
        i32.add
        local.tee $15
        i32.const 2
        i32.shl
        i32.add
        local.get $10
        local.get $15
        i32.const 1
        i32.add
        i32.const 2
        i32.shl
        i32.add
        i32.load
        i32.store
        local.get $2
        i32.const 1
        i32.add
        local.set $2
        br $for-loop|03
       end
      end
      local.get $5
      i32.const 1
      i32.sub
      local.set $5
      global.get $src/assembly/TweenAxisCore/gOutCount
      local.tee $2
      i32.const 1
      i32.add
      global.set $src/assembly/TweenAxisCore/gOutCount
      global.get $src/assembly/TweenAxisCore/gOutgoing
      local.get $2
      i32.const 2
      i32.shl
      i32.add
      local.get $14
      i32.store
     else
      global.get $src/assembly/TweenAxisCore/gIncoming
      local.set $15
      global.get $src/assembly/TweenAxisCore/gInCount
      local.set $16
      i32.const 0
      local.get $14
      i32.sub
      local.set $10
      i32.const 0
      local.set $2
      block $__inlined_func$src/assembly/TweenAxisCore/indexOfFlat$109
       loop $for-loop|06
        local.get $2
        local.get $16
        i32.lt_s
        if
         local.get $10
         local.get $15
         local.get $2
         i32.const 2
         i32.shl
         i32.add
         i32.load
         i32.eq
         br_if $__inlined_func$src/assembly/TweenAxisCore/indexOfFlat$109
         local.get $2
         i32.const 1
         i32.add
         local.set $2
         br $for-loop|06
        end
       end
       i32.const -1
       local.set $2
      end
      local.get $2
      i32.const -1
      i32.ne
      if
       global.get $src/assembly/TweenAxisCore/gIncoming
       local.set $10
       global.get $src/assembly/TweenAxisCore/gInCount
       local.set $15
       loop $for-loop|07
        local.get $2
        local.get $15
        i32.const 1
        i32.sub
        i32.lt_s
        if
         local.get $10
         local.get $2
         i32.const 2
         i32.shl
         i32.add
         local.get $10
         local.get $2
         i32.const 1
         i32.add
         local.tee $2
         i32.const 2
         i32.shl
         i32.add
         i32.load
         i32.store
         br $for-loop|07
        end
       end
       global.get $src/assembly/TweenAxisCore/gInCount
       i32.const 1
       i32.sub
       global.set $src/assembly/TweenAxisCore/gInCount
       global.get $src/assembly/TweenAxisCore/gOutCount
       local.tee $2
       i32.const 1
       i32.add
       global.set $src/assembly/TweenAxisCore/gOutCount
       global.get $src/assembly/TweenAxisCore/gOutgoing
       local.get $2
       i32.const 2
       i32.shl
       i32.add
       local.get $14
       i32.store
      else
       global.get $src/assembly/TweenAxisCore/gInCount
       local.tee $2
       i32.const 1
       i32.add
       global.set $src/assembly/TweenAxisCore/gInCount
       global.get $src/assembly/TweenAxisCore/gIncoming
       local.get $2
       i32.const 2
       i32.shl
       i32.add
       local.get $14
       i32.store
      end
     end
    end
    local.get $4
    i32.const 1
    i32.add
    local.set $4
    br $while-continue|0
   end
  end
  loop $while-continue|1
   local.get $4
   i32.const 1
   i32.sub
   i32.const 0
   i32.ge_s
   if (result i32)
    local.get $1
    global.get $src/assembly/TweenAxisCore/gMarks
    local.get $4
    local.get $11
    i32.add
    i32.const 1
    i32.sub
    i32.const 3
    i32.shl
    i32.add
    f64.load
    f64.lt
    if (result i32)
     i32.const 1
    else
     local.get $9
     f64.const 0
     f64.lt
     if (result i32)
      local.get $1
      global.get $src/assembly/TweenAxisCore/gMarks
      local.get $4
      local.get $11
      i32.add
      i32.const 1
      i32.sub
      i32.const 3
      i32.shl
      i32.add
      f64.load
      f64.eq
     else
      i32.const 0
     end
    end
   else
    i32.const 0
   end
   if
    global.get $src/assembly/TweenAxisCore/gActive
    local.set $10
    i32.const 0
    global.get $src/assembly/TweenAxisCore/gMarksKeys
    local.get $11
    local.get $4
    i32.const 1
    i32.sub
    local.tee $4
    i32.add
    i32.const 2
    i32.shl
    i32.add
    i32.load
    local.tee $13
    i32.sub
    local.set $14
    i32.const 0
    local.set $2
    block $__inlined_func$src/assembly/TweenAxisCore/indexOf$111
     loop $for-loop|08
      local.get $2
      local.get $5
      i32.lt_s
      if
       local.get $14
       local.get $10
       local.get $2
       local.get $12
       i32.add
       i32.const 2
       i32.shl
       i32.add
       i32.load
       i32.eq
       br_if $__inlined_func$src/assembly/TweenAxisCore/indexOf$111
       local.get $2
       i32.const 1
       i32.add
       local.set $2
       br $for-loop|08
      end
     end
     i32.const -1
     local.set $2
    end
    local.get $2
    i32.const -1
    i32.ne
    if
     global.get $src/assembly/TweenAxisCore/gActive
     local.set $10
     loop $for-loop|010
      local.get $2
      local.get $5
      i32.const 1
      i32.sub
      i32.lt_s
      if
       local.get $10
       local.get $2
       local.get $12
       i32.add
       local.tee $14
       i32.const 2
       i32.shl
       i32.add
       local.get $10
       local.get $14
       i32.const 1
       i32.add
       i32.const 2
       i32.shl
       i32.add
       i32.load
       i32.store
       local.get $2
       i32.const 1
       i32.add
       local.set $2
       br $for-loop|010
      end
     end
     local.get $5
     i32.const 1
     i32.sub
     local.set $5
     global.get $src/assembly/TweenAxisCore/gOutCount
     local.tee $2
     i32.const 1
     i32.add
     global.set $src/assembly/TweenAxisCore/gOutCount
     global.get $src/assembly/TweenAxisCore/gOutgoing
     local.get $2
     i32.const 2
     i32.shl
     i32.add
     local.get $13
     i32.store
    else
     global.get $src/assembly/TweenAxisCore/gActive
     local.set $10
     i32.const 0
     local.set $2
     block $__inlined_func$src/assembly/TweenAxisCore/indexOf$113
      loop $for-loop|013
       local.get $2
       local.get $5
       i32.lt_s
       if
        local.get $13
        local.get $10
        local.get $2
        local.get $12
        i32.add
        i32.const 2
        i32.shl
        i32.add
        i32.load
        i32.eq
        br_if $__inlined_func$src/assembly/TweenAxisCore/indexOf$113
        local.get $2
        i32.const 1
        i32.add
        local.set $2
        br $for-loop|013
       end
      end
      i32.const -1
      local.set $2
     end
     local.get $2
     i32.const -1
     i32.ne
     if
      global.get $src/assembly/TweenAxisCore/gActive
      local.set $10
      loop $for-loop|015
       local.get $2
       local.get $5
       i32.const 1
       i32.sub
       i32.lt_s
       if
        local.get $10
        local.get $2
        local.get $12
        i32.add
        local.tee $14
        i32.const 2
        i32.shl
        i32.add
        local.get $10
        local.get $14
        i32.const 1
        i32.add
        i32.const 2
        i32.shl
        i32.add
        i32.load
        i32.store
        local.get $2
        i32.const 1
        i32.add
        local.set $2
        br $for-loop|015
       end
      end
      local.get $5
      i32.const 1
      i32.sub
      local.set $5
      global.get $src/assembly/TweenAxisCore/gOutCount
      local.tee $2
      i32.const 1
      i32.add
      global.set $src/assembly/TweenAxisCore/gOutCount
      global.get $src/assembly/TweenAxisCore/gOutgoing
      local.get $2
      i32.const 2
      i32.shl
      i32.add
      local.get $13
      i32.store
     else
      global.get $src/assembly/TweenAxisCore/gIncoming
      local.set $10
      global.get $src/assembly/TweenAxisCore/gInCount
      local.set $14
      i32.const 0
      local.get $13
      i32.sub
      local.set $15
      i32.const 0
      local.set $2
      block $__inlined_func$src/assembly/TweenAxisCore/indexOfFlat$115
       loop $for-loop|018
        local.get $2
        local.get $14
        i32.lt_s
        if
         local.get $15
         local.get $10
         local.get $2
         i32.const 2
         i32.shl
         i32.add
         i32.load
         i32.eq
         br_if $__inlined_func$src/assembly/TweenAxisCore/indexOfFlat$115
         local.get $2
         i32.const 1
         i32.add
         local.set $2
         br $for-loop|018
        end
       end
       i32.const -1
       local.set $2
      end
      local.get $2
      i32.const -1
      i32.ne
      if
       global.get $src/assembly/TweenAxisCore/gIncoming
       local.set $10
       global.get $src/assembly/TweenAxisCore/gInCount
       local.set $14
       loop $for-loop|020
        local.get $2
        local.get $14
        i32.const 1
        i32.sub
        i32.lt_s
        if
         local.get $10
         local.get $2
         i32.const 2
         i32.shl
         i32.add
         local.get $10
         local.get $2
         i32.const 1
         i32.add
         local.tee $2
         i32.const 2
         i32.shl
         i32.add
         i32.load
         i32.store
         br $for-loop|020
        end
       end
       global.get $src/assembly/TweenAxisCore/gInCount
       i32.const 1
       i32.sub
       global.set $src/assembly/TweenAxisCore/gInCount
       global.get $src/assembly/TweenAxisCore/gOutCount
       local.tee $2
       i32.const 1
       i32.add
       global.set $src/assembly/TweenAxisCore/gOutCount
       global.get $src/assembly/TweenAxisCore/gOutgoing
       local.get $2
       i32.const 2
       i32.shl
       i32.add
       local.get $13
       i32.store
      else
       global.get $src/assembly/TweenAxisCore/gInCount
       local.tee $2
       i32.const 1
       i32.add
       global.set $src/assembly/TweenAxisCore/gInCount
       global.get $src/assembly/TweenAxisCore/gIncoming
       local.get $2
       i32.const 2
       i32.shl
       i32.add
       local.get $13
       i32.store
      end
     end
    end
    br $while-continue|1
   end
  end
  global.get $src/assembly/TweenAxisCore/gCIndex
  local.get $0
  i32.const 2
  i32.shl
  i32.add
  local.get $4
  i32.store
  i32.const 0
  global.set $src/assembly/TweenAxisCore/gResultCount
  loop $for-loop|2
   local.get $3
   global.get $src/assembly/TweenAxisCore/gOutCount
   i32.lt_s
   if
    global.get $src/assembly/TweenAxisCore/gMarksLen
    i32.const 0
    global.get $src/assembly/TweenAxisCore/gOutgoing
    local.get $3
    i32.const 2
    i32.shl
    i32.add
    i32.load
    local.tee $4
    i32.sub
    local.get $4
    local.get $4
    i32.const 0
    i32.lt_s
    select
    local.tee $10
    local.get $0
    i32.const 8
    i32.shl
    i32.add
    i32.const 3
    i32.shl
    i32.add
    f64.load
    local.set $17
    global.get $src/assembly/TweenAxisCore/gMarks
    local.get $0
    i32.const 9
    i32.shl
    local.set $12
    global.get $src/assembly/TweenAxisCore/gMarksCount
    local.get $0
    i32.const 2
    i32.shl
    i32.add
    i32.load
    local.set $13
    i32.const 0
    local.set $2
    block $__inlined_func$src/assembly/TweenAxisCore/indexOfMarkKey$117
     loop $for-loop|023
      local.get $2
      local.get $13
      i32.lt_s
      if
       local.get $4
       global.get $src/assembly/TweenAxisCore/gMarksKeys
       local.get $2
       local.get $12
       i32.add
       i32.const 2
       i32.shl
       i32.add
       i32.load
       i32.eq
       br_if $__inlined_func$src/assembly/TweenAxisCore/indexOfMarkKey$117
       local.get $2
       i32.const 1
       i32.add
       local.set $2
       br $for-loop|023
      end
     end
     i32.const 0
     local.set $2
    end
    local.get $2
    local.get $0
    i32.const 9
    i32.shl
    i32.add
    i32.const 3
    i32.shl
    i32.add
    f64.load
    local.set $6
    local.get $4
    i32.const 0
    i32.lt_s
    if (result f64)
     local.get $17
     local.get $6
     local.get $17
     f64.sub
     local.tee $18
     local.get $7
     f64.max
     local.get $6
     f64.min
     local.get $18
     f64.sub
     local.tee $6
     f64.sub
    else
     local.get $6
     local.get $17
     f64.add
     local.get $7
     f64.min
     local.get $6
     f64.max
     local.get $6
     f64.sub
     local.tee $6
     f64.neg
    end
    local.set $18
    global.get $src/assembly/TweenAxisCore/gResultBuf
    global.get $src/assembly/TweenAxisCore/gResultCount
    i32.const 2
    i32.shl
    local.tee $2
    i32.const 3
    i32.shl
    i32.add
    f64.const 0
    f64.store
    global.get $src/assembly/TweenAxisCore/gResultBuf
    local.get $2
    i32.const 1
    i32.add
    i32.const 3
    i32.shl
    i32.add
    local.get $10
    f64.convert_i32_s
    f64.store
    global.get $src/assembly/TweenAxisCore/gResultBuf
    local.get $2
    i32.const 2
    i32.add
    i32.const 3
    i32.shl
    i32.add
    local.get $8
    local.get $6
    f64.mul
    local.get $17
    f64.div
    f64.store
    global.get $src/assembly/TweenAxisCore/gResultBuf
    local.get $2
    i32.const 3
    i32.add
    i32.const 3
    i32.shl
    i32.add
    local.get $8
    local.get $18
    f64.mul
    local.get $17
    f64.div
    f64.store
    global.get $src/assembly/TweenAxisCore/gResultCount
    i32.const 1
    i32.add
    global.set $src/assembly/TweenAxisCore/gResultCount
    local.get $3
    i32.const 1
    i32.add
    local.set $3
    br $for-loop|2
   end
  end
  i32.const 0
  local.set $3
  loop $for-loop|3
   local.get $3
   global.get $src/assembly/TweenAxisCore/gInCount
   i32.lt_s
   if
    global.get $src/assembly/TweenAxisCore/gMarksLen
    i32.const 0
    global.get $src/assembly/TweenAxisCore/gIncoming
    local.get $3
    i32.const 2
    i32.shl
    i32.add
    i32.load
    local.tee $4
    i32.sub
    local.get $4
    local.get $4
    i32.const 0
    i32.lt_s
    select
    local.tee $10
    local.get $0
    i32.const 8
    i32.shl
    i32.add
    i32.const 3
    i32.shl
    i32.add
    f64.load
    local.set $17
    global.get $src/assembly/TweenAxisCore/gMarks
    local.get $0
    i32.const 9
    i32.shl
    local.set $12
    global.get $src/assembly/TweenAxisCore/gMarksCount
    local.get $0
    i32.const 2
    i32.shl
    i32.add
    i32.load
    local.set $13
    i32.const 0
    local.set $2
    block $__inlined_func$src/assembly/TweenAxisCore/indexOfMarkKey$118
     loop $for-loop|025
      local.get $2
      local.get $13
      i32.lt_s
      if
       local.get $4
       global.get $src/assembly/TweenAxisCore/gMarksKeys
       local.get $2
       local.get $12
       i32.add
       i32.const 2
       i32.shl
       i32.add
       i32.load
       i32.eq
       br_if $__inlined_func$src/assembly/TweenAxisCore/indexOfMarkKey$118
       local.get $2
       i32.const 1
       i32.add
       local.set $2
       br $for-loop|025
      end
     end
     i32.const 0
     local.set $2
    end
    local.get $2
    local.get $0
    i32.const 9
    i32.shl
    i32.add
    i32.const 3
    i32.shl
    i32.add
    f64.load
    local.set $6
    global.get $src/assembly/TweenAxisCore/gResultBuf
    global.get $src/assembly/TweenAxisCore/gResultCount
    i32.const 2
    i32.shl
    local.tee $2
    i32.const 3
    i32.shl
    i32.add
    f64.const 1
    f64.store
    global.get $src/assembly/TweenAxisCore/gResultBuf
    local.get $2
    i32.const 1
    i32.add
    i32.const 3
    i32.shl
    i32.add
    local.get $10
    f64.convert_i32_s
    f64.store
    global.get $src/assembly/TweenAxisCore/gResultBuf
    local.get $2
    i32.const 2
    i32.add
    i32.const 3
    i32.shl
    i32.add
    local.get $8
    local.get $4
    i32.const 0
    i32.lt_s
    if (result f64)
     local.get $6
     local.get $17
     f64.sub
     local.tee $18
     local.get $6
     local.get $7
     local.get $9
     f64.add
     f64.min
     f64.max
     local.get $18
     f64.sub
     local.get $17
     f64.sub
     local.set $6
     local.get $17
    else
     local.get $7
     local.get $9
     f64.add
     local.get $6
     local.get $17
     f64.add
     f64.min
     local.get $6
     f64.max
     local.get $6
     f64.sub
     local.set $6
     f64.const 0
    end
    f64.mul
    local.get $17
    f64.div
    f64.store
    global.get $src/assembly/TweenAxisCore/gResultBuf
    local.get $2
    i32.const 3
    i32.add
    i32.const 3
    i32.shl
    i32.add
    local.get $8
    local.get $6
    f64.mul
    local.get $17
    f64.div
    f64.store
    global.get $src/assembly/TweenAxisCore/gResultCount
    i32.const 1
    i32.add
    global.set $src/assembly/TweenAxisCore/gResultCount
    local.get $3
    i32.const 1
    i32.add
    local.set $3
    br $for-loop|3
   end
  end
  i32.const 0
  local.set $3
  loop $for-loop|4
   local.get $3
   local.get $5
   i32.lt_s
   if
    i32.const 0
    global.get $src/assembly/TweenAxisCore/gActive
    local.get $0
    i32.const 8
    i32.shl
    local.tee $2
    local.get $3
    i32.add
    i32.const 2
    i32.shl
    i32.add
    i32.load
    local.tee $4
    i32.sub
    local.get $4
    local.get $4
    i32.const 0
    i32.lt_s
    select
    local.set $10
    global.get $src/assembly/TweenAxisCore/gMarksLen
    local.get $2
    local.get $10
    i32.add
    i32.const 3
    i32.shl
    i32.add
    f64.load
    local.set $6
    global.get $src/assembly/TweenAxisCore/gMarks
    local.get $0
    i32.const 9
    i32.shl
    local.set $12
    global.get $src/assembly/TweenAxisCore/gMarksCount
    local.get $0
    i32.const 2
    i32.shl
    i32.add
    i32.load
    local.set $13
    i32.const 0
    local.set $2
    block $__inlined_func$src/assembly/TweenAxisCore/indexOfMarkKey$119
     loop $for-loop|028
      local.get $2
      local.get $13
      i32.lt_s
      if
       local.get $4
       global.get $src/assembly/TweenAxisCore/gMarksKeys
       local.get $2
       local.get $12
       i32.add
       i32.const 2
       i32.shl
       i32.add
       i32.load
       i32.eq
       br_if $__inlined_func$src/assembly/TweenAxisCore/indexOfMarkKey$119
       local.get $2
       i32.const 1
       i32.add
       local.set $2
       br $for-loop|028
      end
     end
     i32.const 0
     local.set $2
    end
    local.get $2
    local.get $0
    i32.const 9
    i32.shl
    i32.add
    i32.const 3
    i32.shl
    i32.add
    f64.load
    local.set $17
    global.get $src/assembly/TweenAxisCore/gResultBuf
    global.get $src/assembly/TweenAxisCore/gResultCount
    i32.const 2
    i32.shl
    local.tee $2
    i32.const 3
    i32.shl
    i32.add
    f64.const 2
    f64.store
    global.get $src/assembly/TweenAxisCore/gResultBuf
    local.get $2
    i32.const 1
    i32.add
    i32.const 3
    i32.shl
    i32.add
    local.get $10
    f64.convert_i32_s
    f64.store
    global.get $src/assembly/TweenAxisCore/gResultBuf
    local.get $2
    i32.const 2
    i32.add
    i32.const 3
    i32.shl
    i32.add
    local.get $8
    local.get $7
    local.get $17
    local.get $6
    f64.sub
    f64.sub
    local.get $7
    local.get $17
    f64.sub
    local.get $4
    i32.const 0
    i32.lt_s
    select
    f64.mul
    local.get $6
    f64.div
    f64.store
    global.get $src/assembly/TweenAxisCore/gResultBuf
    local.get $2
    i32.const 3
    i32.add
    i32.const 3
    i32.shl
    i32.add
    local.get $9
    local.get $8
    f64.mul
    local.get $6
    f64.div
    f64.store
    global.get $src/assembly/TweenAxisCore/gResultCount
    i32.const 1
    i32.add
    global.set $src/assembly/TweenAxisCore/gResultCount
    local.get $3
    i32.const 1
    i32.add
    local.set $3
    br $for-loop|4
   end
  end
  i32.const 0
  local.set $2
  loop $for-loop|5
   local.get $2
   global.get $src/assembly/TweenAxisCore/gInCount
   i32.lt_s
   if
    global.get $src/assembly/TweenAxisCore/gActive
    local.get $0
    i32.const 8
    i32.shl
    local.get $5
    i32.add
    i32.const 2
    i32.shl
    i32.add
    global.get $src/assembly/TweenAxisCore/gIncoming
    local.get $2
    i32.const 2
    i32.shl
    i32.add
    i32.load
    i32.store
    local.get $5
    i32.const 1
    i32.add
    local.set $5
    local.get $2
    i32.const 1
    i32.add
    local.set $2
    br $for-loop|5
   end
  end
  global.get $src/assembly/TweenAxisCore/gActiveCount
  local.get $0
  i32.const 2
  i32.shl
  i32.add
  local.get $5
  i32.store
  i32.const 0
  global.set $src/assembly/TweenAxisCore/gOutCount
  i32.const 0
  global.set $src/assembly/TweenAxisCore/gInCount
  global.get $src/assembly/TweenAxisCore/gCPos
  local.get $0
  i32.const 3
  i32.shl
  i32.add
  local.get $1
  f64.store
  global.get $src/assembly/TweenAxisCore/gResultCount
 )
 (func $src/assembly/TweenAxisCore/getResultPhase (param $0 i32) (result i32)
  global.get $src/assembly/TweenAxisCore/gResultBuf
  local.get $0
  i32.const 5
  i32.shl
  i32.add
  f64.load
  i32.trunc_sat_f64_s
 )
 (func $src/assembly/TweenAxisCore/getResultKey (param $0 i32) (result i32)
  global.get $src/assembly/TweenAxisCore/gResultBuf
  local.get $0
  i32.const 2
  i32.shl
  i32.const 1
  i32.add
  i32.const 3
  i32.shl
  i32.add
  f64.load
  i32.trunc_sat_f64_s
 )
 (func $src/assembly/TweenAxisCore/getResultPos (param $0 i32) (result f64)
  global.get $src/assembly/TweenAxisCore/gResultBuf
  local.get $0
  i32.const 2
  i32.shl
  i32.const 2
  i32.add
  i32.const 3
  i32.shl
  i32.add
  f64.load
 )
 (func $src/assembly/TweenAxisCore/getResultDelta (param $0 i32) (result f64)
  global.get $src/assembly/TweenAxisCore/gResultBuf
  local.get $0
  i32.const 2
  i32.shl
  i32.const 3
  i32.add
  i32.const 3
  i32.shl
  i32.add
  f64.load
 )
 (func $~start
  i32.const 1276
  global.set $~lib/rt/stub/offset
  i32.const 32768
  call $~lib/staticarray/StaticArray<f64>#constructor
  global.set $src/assembly/TweenAxisCore/gMarks
  i32.const 32768
  call $~lib/staticarray/StaticArray<i32>#constructor
  global.set $src/assembly/TweenAxisCore/gMarksKeys
  i32.const 16384
  call $~lib/staticarray/StaticArray<f64>#constructor
  global.set $src/assembly/TweenAxisCore/gMarksLen
  i32.const 16384
  call $~lib/staticarray/StaticArray<i32>#constructor
  global.set $src/assembly/TweenAxisCore/gActive
  i32.const 64
  call $~lib/staticarray/StaticArray<i32>#constructor
  global.set $src/assembly/TweenAxisCore/gMarksCount
  i32.const 64
  call $~lib/staticarray/StaticArray<i32>#constructor
  global.set $src/assembly/TweenAxisCore/gActiveCount
  i32.const 64
  call $~lib/staticarray/StaticArray<i32>#constructor
  global.set $src/assembly/TweenAxisCore/gCIndex
  i32.const 64
  call $~lib/staticarray/StaticArray<f64>#constructor
  global.set $src/assembly/TweenAxisCore/gCPos
  i32.const 64
  call $~lib/staticarray/StaticArray<f64>#constructor
  global.set $src/assembly/TweenAxisCore/gLocalLen
  i32.const 64
  call $~lib/staticarray/StaticArray<i32>#constructor
  global.set $src/assembly/TweenAxisCore/gStarted
  i32.const 64
  call $~lib/staticarray/StaticArray<i32>#constructor
  global.set $src/assembly/TweenAxisCore/gCtxUsed
  i32.const 512
  call $~lib/staticarray/StaticArray<i32>#constructor
  global.set $src/assembly/TweenAxisCore/gOutgoing
  i32.const 512
  call $~lib/staticarray/StaticArray<i32>#constructor
  global.set $src/assembly/TweenAxisCore/gIncoming
  i32.const 2048
  call $~lib/staticarray/StaticArray<f64>#constructor
  global.set $src/assembly/TweenAxisCore/gResultBuf
 )
)
