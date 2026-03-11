(module
 (type $0 (func (param i32) (result i32)))
 (type $1 (func (param i32) (result f64)))
 (type $2 (func (param i32)))
 (type $3 (func (param i32 i32 i32 i32)))
 (type $4 (func (param i32 i32) (result i32)))
 (type $5 (func (param i32 i32)))
 (type $6 (func (result i32)))
 (type $7 (func (param i32 f64)))
 (type $8 (func (param i32 f64 f64 f64 i32)))
 (type $9 (func (param i32 f64 i32) (result i32)))
 (type $10 (func))
 (import "env" "abort" (func $~lib/builtins/abort (param i32 i32 i32 i32)))
 (global $~lib/rt/stub/offset (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gContexts (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gFreeSlots (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gOutgoing (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gIncoming (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gOutCount (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gInCount (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gResultBuf (mut i32) (i32.const 0))
 (global $src/assembly/TweenAxisCore/gResultCount (mut i32) (i32.const 0))
 (memory $0 1)
 (data $0 (i32.const 1036) ",")
 (data $0.1 (i32.const 1048) "\02\00\00\00\1c\00\00\00I\00n\00v\00a\00l\00i\00d\00 \00l\00e\00n\00g\00t\00h")
 (data $1 (i32.const 1084) ",")
 (data $1.1 (i32.const 1096) "\02\00\00\00\1a\00\00\00~\00l\00i\00b\00/\00a\00r\00r\00a\00y\00.\00t\00s")
 (data $2 (i32.const 1132) "<")
 (data $2.1 (i32.const 1144) "\02\00\00\00(\00\00\00A\00l\00l\00o\00c\00a\00t\00i\00o\00n\00 \00t\00o\00o\00 \00l\00a\00r\00g\00e")
 (data $3 (i32.const 1196) "<")
 (data $3.1 (i32.const 1208) "\02\00\00\00\1e\00\00\00~\00l\00i\00b\00/\00r\00t\00/\00s\00t\00u\00b\00.\00t\00s")
 (data $4 (i32.const 1260) "<")
 (data $4.1 (i32.const 1272) "\02\00\00\00&\00\00\00~\00l\00i\00b\00/\00s\00t\00a\00t\00i\00c\00a\00r\00r\00a\00y\00.\00t\00s")
 (data $5 (i32.const 1324) ",")
 (data $5.1 (i32.const 1336) "\02\00\00\00\1c\00\00\00A\00r\00r\00a\00y\00 \00i\00s\00 \00e\00m\00p\00t\00y")
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
 (func $~lib/rt/stub/__alloc (param $0 i32) (result i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  local.get $0
  i32.const 1073741820
  i32.gt_u
  if
   i32.const 1152
   i32.const 1216
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
  local.get $0
  i32.const 19
  i32.add
  i32.const -16
  i32.and
  i32.const 4
  i32.sub
  local.tee $0
  i32.add
  local.tee $3
  memory.size
  local.tee $4
  i32.const 16
  i32.shl
  i32.const 15
  i32.add
  i32.const -16
  i32.and
  local.tee $5
  i32.gt_u
  if
   local.get $4
   local.get $3
   local.get $5
   i32.sub
   i32.const 65535
   i32.add
   i32.const -65536
   i32.and
   i32.const 16
   i32.shr_u
   local.tee $5
   local.get $4
   local.get $5
   i32.gt_s
   select
   memory.grow
   i32.const 0
   i32.lt_s
   if
    local.get $5
    memory.grow
    i32.const 0
    i32.lt_s
    if
     unreachable
    end
   end
  end
  local.get $3
  global.set $~lib/rt/stub/offset
  local.get $0
  i32.store
  local.get $2
 )
 (func $~lib/rt/stub/__new (param $0 i32) (param $1 i32) (result i32)
  (local $2 i32)
  (local $3 i32)
  local.get $0
  i32.const 1073741804
  i32.gt_u
  if
   i32.const 1152
   i32.const 1216
   i32.const 86
   i32.const 30
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  i32.const 16
  i32.add
  call $~lib/rt/stub/__alloc
  local.tee $3
  i32.const 4
  i32.sub
  local.tee $2
  i32.const 0
  i32.store offset=4
  local.get $2
  i32.const 0
  i32.store offset=8
  local.get $2
  local.get $1
  i32.store offset=12
  local.get $2
  local.get $0
  i32.store offset=16
  local.get $3
  i32.const 16
  i32.add
 )
 (func $~lib/staticarray/StaticArray<i32>#constructor (param $0 i32) (result i32)
  (local $1 i32)
  local.get $0
  i32.const 268435455
  i32.gt_u
  if
   i32.const 1056
   i32.const 1280
   i32.const 51
   i32.const 60
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  i32.const 2
  i32.shl
  local.tee $0
  i32.const 6
  call $~lib/rt/stub/__new
  local.tee $1
  i32.const 0
  local.get $0
  memory.fill
  local.get $1
 )
 (func $~lib/staticarray/StaticArray<f64>#constructor (param $0 i32) (result i32)
  (local $1 i32)
  local.get $0
  i32.const 134217727
  i32.gt_u
  if
   i32.const 1056
   i32.const 1280
   i32.const 51
   i32.const 60
   call $~lib/builtins/abort
   unreachable
  end
  local.get $0
  i32.const 3
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
 (func $~lib/array/ensureCapacity (param $0 i32) (param $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  local.get $1
  local.get $0
  i32.load offset=8
  local.tee $3
  i32.const 2
  i32.shr_u
  i32.gt_u
  if
   local.get $1
   i32.const 268435455
   i32.gt_u
   if
    i32.const 1056
    i32.const 1104
    i32.const 19
    i32.const 48
    call $~lib/builtins/abort
    unreachable
   end
   local.get $0
   i32.load
   local.set $4
   i32.const 1073741820
   local.get $3
   i32.const 1
   i32.shl
   local.tee $2
   local.get $2
   i32.const 1073741820
   i32.ge_u
   select
   local.tee $2
   i32.const 8
   local.get $1
   local.get $1
   i32.const 8
   i32.le_u
   select
   i32.const 2
   i32.shl
   local.tee $1
   local.get $1
   local.get $2
   i32.lt_u
   select
   local.tee $5
   i32.const 1073741804
   i32.gt_u
   if
    i32.const 1152
    i32.const 1216
    i32.const 99
    i32.const 30
    call $~lib/builtins/abort
    unreachable
   end
   local.get $4
   i32.const 16
   i32.sub
   local.tee $1
   i32.const 4
   i32.sub
   local.tee $6
   i32.load
   local.set $7
   global.get $~lib/rt/stub/offset
   local.get $1
   local.get $7
   i32.add
   i32.eq
   local.set $8
   local.get $5
   i32.const 16
   i32.add
   local.tee $9
   i32.const 19
   i32.add
   i32.const -16
   i32.and
   i32.const 4
   i32.sub
   local.set $2
   local.get $7
   local.get $9
   i32.lt_u
   if
    local.get $8
    if
     local.get $9
     i32.const 1073741820
     i32.gt_u
     if
      i32.const 1152
      i32.const 1216
      i32.const 52
      i32.const 33
      call $~lib/builtins/abort
      unreachable
     end
     local.get $1
     local.get $2
     i32.add
     local.tee $7
     memory.size
     local.tee $8
     i32.const 16
     i32.shl
     i32.const 15
     i32.add
     i32.const -16
     i32.and
     local.tee $9
     i32.gt_u
     if
      local.get $8
      local.get $7
      local.get $9
      i32.sub
      i32.const 65535
      i32.add
      i32.const -65536
      i32.and
      i32.const 16
      i32.shr_u
      local.tee $9
      local.get $8
      local.get $9
      i32.gt_s
      select
      memory.grow
      i32.const 0
      i32.lt_s
      if
       local.get $9
       memory.grow
       i32.const 0
       i32.lt_s
       if
        unreachable
       end
      end
     end
     local.get $7
     global.set $~lib/rt/stub/offset
     local.get $6
     local.get $2
     i32.store
    else
     local.get $2
     local.get $7
     i32.const 1
     i32.shl
     local.tee $6
     local.get $2
     local.get $6
     i32.gt_u
     select
     call $~lib/rt/stub/__alloc
     local.tee $2
     local.get $1
     local.get $7
     memory.copy
     local.get $2
     local.set $1
    end
   else
    local.get $8
    if
     local.get $1
     local.get $2
     i32.add
     global.set $~lib/rt/stub/offset
     local.get $6
     local.get $2
     i32.store
    end
   end
   local.get $1
   i32.const 4
   i32.sub
   local.get $5
   i32.store offset=16
   local.get $3
   local.get $1
   i32.const 16
   i32.add
   local.tee $1
   i32.add
   i32.const 0
   local.get $5
   local.get $3
   i32.sub
   memory.fill
   local.get $1
   local.get $4
   i32.ne
   if
    local.get $0
    local.get $1
    i32.store
    local.get $0
    local.get $1
    i32.store offset=4
   end
   local.get $0
   local.get $5
   i32.store offset=8
  end
 )
 (func $src/assembly/TweenAxisCore/createContext (result i32)
  (local $0 i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local $4 i32)
  global.get $src/assembly/TweenAxisCore/gFreeSlots
  i32.load offset=12
  i32.const 0
  i32.gt_s
  if
   global.get $src/assembly/TweenAxisCore/gFreeSlots
   local.tee $0
   i32.load offset=12
   local.tee $1
   i32.const 0
   i32.le_s
   if
    i32.const 1344
    i32.const 1104
    i32.const 271
    i32.const 18
    call $~lib/builtins/abort
    unreachable
   end
   local.get $0
   i32.load offset=4
   local.get $1
   i32.const 1
   i32.sub
   local.tee $1
   i32.const 2
   i32.shl
   i32.add
   i32.load
   local.get $0
   local.get $1
   i32.store offset=12
   return
  end
  global.get $src/assembly/TweenAxisCore/gContexts
  i32.load offset=12
  global.get $src/assembly/TweenAxisCore/gContexts
  local.set $3
  i32.const 52
  i32.const 4
  call $~lib/rt/stub/__new
  local.tee $4
  i32.const 0
  i32.store
  local.get $4
  i32.const 0
  i32.store offset=4
  local.get $4
  i32.const 0
  i32.store offset=8
  local.get $4
  i32.const 0
  i32.store offset=12
  local.get $4
  i32.const 0
  i32.store offset=16
  local.get $4
  i32.const 0
  i32.store offset=20
  local.get $4
  i32.const 0
  i32.store offset=24
  local.get $4
  f64.const 0
  f64.store offset=32
  local.get $4
  f64.const 0
  f64.store offset=40
  local.get $4
  i32.const 0
  i32.store offset=48
  local.get $4
  i32.const 512
  call $~lib/staticarray/StaticArray<f64>#constructor
  i32.store
  local.get $4
  i32.const 512
  call $~lib/staticarray/StaticArray<i32>#constructor
  i32.store offset=4
  local.get $4
  i32.const 256
  call $~lib/staticarray/StaticArray<f64>#constructor
  i32.store offset=8
  local.get $4
  i32.const 256
  call $~lib/staticarray/StaticArray<i32>#constructor
  i32.store offset=12
  local.get $4
  i32.const 0
  i32.store offset=16
  local.get $4
  i32.const 0
  i32.store offset=20
  local.get $4
  i32.const 0
  i32.store offset=24
  local.get $4
  f64.const 0
  f64.store offset=32
  local.get $4
  f64.const 1
  f64.store offset=40
  local.get $4
  i32.const 0
  i32.store offset=48
  local.get $3
  local.get $3
  i32.load offset=12
  local.tee $0
  i32.const 1
  i32.add
  local.tee $1
  call $~lib/array/ensureCapacity
  local.get $3
  i32.load offset=4
  local.get $0
  i32.const 2
  i32.shl
  i32.add
  local.get $4
  i32.store
  local.get $3
  local.get $1
  i32.store offset=12
 )
 (func $src/assembly/TweenAxisCore/destroyContext (param $0 i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  global.get $src/assembly/TweenAxisCore/gContexts
  i32.load offset=4
  local.get $0
  i32.const 2
  i32.shl
  i32.add
  i32.load
  local.tee $1
  i32.const 0
  i32.store offset=16
  local.get $1
  i32.const 0
  i32.store offset=20
  local.get $1
  i32.const 0
  i32.store offset=24
  local.get $1
  f64.const 0
  f64.store offset=32
  local.get $1
  f64.const 1
  f64.store offset=40
  local.get $1
  i32.const 0
  i32.store offset=48
  global.get $src/assembly/TweenAxisCore/gFreeSlots
  local.tee $2
  i32.load offset=12
  local.tee $1
  i32.const 1
  i32.add
  local.set $3
  local.get $2
  local.get $3
  call $~lib/array/ensureCapacity
  local.get $2
  i32.load offset=4
  local.get $1
  i32.const 2
  i32.shl
  i32.add
  local.get $0
  i32.store
  local.get $2
  local.get $3
  i32.store offset=12
 )
 (func $src/assembly/TweenAxisCore/resetContext (param $0 i32)
  global.get $src/assembly/TweenAxisCore/gContexts
  i32.load offset=4
  local.get $0
  i32.const 2
  i32.shl
  i32.add
  i32.load
  local.tee $0
  i32.const 0
  i32.store offset=16
  local.get $0
  i32.const 0
  i32.store offset=20
  local.get $0
  i32.const 0
  i32.store offset=24
  local.get $0
  f64.const 0
  f64.store offset=32
  local.get $0
  f64.const 1
  f64.store offset=40
  local.get $0
  i32.const 0
  i32.store offset=48
 )
 (func $src/assembly/TweenAxisCore/setLocalLength (param $0 i32) (param $1 f64)
  global.get $src/assembly/TweenAxisCore/gContexts
  i32.load offset=4
  local.get $0
  i32.const 2
  i32.shl
  i32.add
  i32.load
  local.get $1
  f64.store offset=40
 )
 (func $src/assembly/TweenAxisCore/getCurrentPos (param $0 i32) (result f64)
  global.get $src/assembly/TweenAxisCore/gContexts
  i32.load offset=4
  local.get $0
  i32.const 2
  i32.shl
  i32.add
  i32.load
  f64.load offset=32
 )
 (func $src/assembly/TweenAxisCore/addProcess (param $0 i32) (param $1 f64) (param $2 f64) (param $3 f64) (param $4 i32)
  (local $5 i32)
  (local $6 i32)
  (local $7 i32)
  (local $8 i32)
  (local $9 i32)
  global.get $src/assembly/TweenAxisCore/gContexts
  i32.load offset=4
  local.get $0
  i32.const 2
  i32.shl
  i32.add
  i32.load
  local.tee $8
  i32.load offset=16
  local.set $6
  local.get $8
  i32.load offset=8
  local.get $4
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
    local.get $8
    i32.load
    local.get $7
    i32.const 3
    i32.shl
    i32.add
    f64.load
    local.get $1
    f64.lt
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
  local.set $0
  loop $for-loop|1
   local.get $0
   local.get $7
   i32.gt_s
   if
    local.get $8
    i32.load
    local.tee $5
    local.get $0
    i32.const 3
    i32.shl
    i32.add
    local.get $5
    local.get $0
    i32.const 1
    i32.sub
    local.tee $5
    i32.const 3
    i32.shl
    i32.add
    f64.load
    f64.store
    local.get $8
    i32.load offset=4
    local.tee $9
    local.get $0
    i32.const 2
    i32.shl
    i32.add
    local.get $5
    i32.const 2
    i32.shl
    local.get $9
    i32.add
    i32.load
    i32.store
    local.get $5
    local.set $0
    br $for-loop|1
   end
  end
  local.get $8
  i32.load
  local.get $7
  i32.const 3
  i32.shl
  i32.add
  local.get $1
  f64.store
  local.get $8
  i32.load offset=4
  local.get $7
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
    local.get $8
    i32.load
    local.get $7
    i32.const 3
    i32.shl
    i32.add
    f64.load
    local.get $2
    f64.le
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
  local.set $0
  loop $for-loop|3
   local.get $0
   local.get $7
   i32.gt_s
   if
    local.get $8
    i32.load
    local.tee $5
    local.get $0
    i32.const 3
    i32.shl
    i32.add
    local.get $5
    local.get $0
    i32.const 1
    i32.sub
    local.tee $5
    i32.const 3
    i32.shl
    i32.add
    f64.load
    f64.store
    local.get $8
    i32.load offset=4
    local.tee $9
    local.get $0
    i32.const 2
    i32.shl
    i32.add
    local.get $5
    i32.const 2
    i32.shl
    local.get $9
    i32.add
    i32.load
    i32.store
    local.get $5
    local.set $0
    br $for-loop|3
   end
  end
  local.get $8
  i32.load
  local.get $7
  i32.const 3
  i32.shl
  i32.add
  local.get $2
  f64.store
  local.get $8
  i32.load offset=4
  local.get $7
  i32.const 2
  i32.shl
  i32.add
  i32.const 0
  local.get $4
  i32.sub
  i32.store
  local.get $8
  local.get $6
  i32.const 1
  i32.add
  i32.store offset=16
 )
 (func $src/assembly/TweenAxisCore/goTo (param $0 i32) (param $1 f64) (param $2 i32) (result i32)
  (local $3 i32)
  (local $4 i32)
  (local $5 f64)
  (local $6 i32)
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
  (local $17 i32)
  (local $18 f64)
  (local $19 f64)
  global.get $src/assembly/TweenAxisCore/gContexts
  i32.load offset=4
  local.get $0
  i32.const 2
  i32.shl
  i32.add
  i32.load
  local.tee $4
  i32.load offset=48
  i32.eqz
  if
   local.get $4
   i32.const 1
   i32.store offset=48
   local.get $4
   i32.const 0
   i32.store offset=24
   local.get $4
   f64.const 0
   f64.store offset=32
  end
  local.get $4
  i32.load offset=16
  local.set $14
  local.get $4
  i32.load offset=24
  local.set $6
  local.get $1
  local.get $4
  f64.load offset=32
  local.tee $7
  f64.sub
  local.set $9
  local.get $4
  f64.load offset=40
  local.set $8
  i32.const 0
  local.get $4
  i32.load offset=20
  local.get $2
  select
  local.set $0
  i32.const 0
  global.set $src/assembly/TweenAxisCore/gOutCount
  i32.const 0
  global.set $src/assembly/TweenAxisCore/gInCount
  loop $while-continue|0
   local.get $6
   local.get $14
   i32.lt_s
   if (result i32)
    local.get $1
    local.get $4
    i32.load
    local.get $6
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
    local.get $6
    local.get $14
    i32.lt_s
    local.get $9
    f64.const 0
    f64.ge
    i32.and
    if (result i32)
     local.get $4
     i32.load
     local.get $6
     i32.const 3
     i32.shl
     i32.add
     f64.load
     local.get $1
     f64.eq
    else
     i32.const 0
    end
   end
   if
    local.get $4
    i32.load offset=12
    local.set $3
    i32.const 0
    local.get $4
    i32.load offset=4
    local.get $6
    i32.const 2
    i32.shl
    i32.add
    i32.load
    local.tee $15
    i32.sub
    local.set $16
    i32.const 0
    local.set $2
    block $__inlined_func$src/assembly/TweenAxisCore/indexOf$206
     loop $for-loop|0
      local.get $0
      local.get $2
      i32.gt_s
      if
       local.get $3
       local.get $2
       i32.const 2
       i32.shl
       i32.add
       i32.load
       local.get $16
       i32.eq
       br_if $__inlined_func$src/assembly/TweenAxisCore/indexOf$206
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
     local.get $4
     i32.load offset=12
     local.set $16
     local.get $0
     local.set $3
     local.get $2
     local.set $0
     loop $for-loop|00
      local.get $0
      local.get $3
      i32.const 1
      i32.sub
      i32.lt_s
      if
       local.get $16
       local.get $0
       i32.const 2
       i32.shl
       i32.add
       local.get $16
       local.get $0
       i32.const 1
       i32.add
       local.tee $0
       i32.const 2
       i32.shl
       i32.add
       i32.load
       i32.store
       br $for-loop|00
      end
     end
     local.get $3
     i32.const 1
     i32.sub
     local.set $0
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
     local.get $15
     i32.store
    else
     local.get $4
     i32.load offset=12
     local.set $3
     i32.const 0
     local.set $2
     block $__inlined_func$src/assembly/TweenAxisCore/indexOf$208
      loop $for-loop|01
       local.get $0
       local.get $2
       i32.gt_s
       if
        local.get $3
        local.get $2
        i32.const 2
        i32.shl
        i32.add
        i32.load
        local.get $15
        i32.eq
        br_if $__inlined_func$src/assembly/TweenAxisCore/indexOf$208
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
      local.get $4
      i32.load offset=12
      local.set $16
      local.get $0
      local.set $3
      local.get $2
      local.set $0
      loop $for-loop|03
       local.get $0
       local.get $3
       i32.const 1
       i32.sub
       i32.lt_s
       if
        local.get $16
        local.get $0
        i32.const 2
        i32.shl
        i32.add
        local.get $16
        local.get $0
        i32.const 1
        i32.add
        local.tee $0
        i32.const 2
        i32.shl
        i32.add
        i32.load
        i32.store
        br $for-loop|03
       end
      end
      local.get $3
      i32.const 1
      i32.sub
      local.set $0
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
      local.get $15
      i32.store
     else
      global.get $src/assembly/TweenAxisCore/gIncoming
      local.set $16
      global.get $src/assembly/TweenAxisCore/gInCount
      local.set $17
      i32.const 0
      local.get $15
      i32.sub
      local.set $3
      i32.const 0
      local.set $2
      block $__inlined_func$src/assembly/TweenAxisCore/indexOf$210
       loop $for-loop|06
        local.get $2
        local.get $17
        i32.lt_s
        if
         local.get $16
         local.get $2
         i32.const 2
         i32.shl
         i32.add
         i32.load
         local.get $3
         i32.eq
         br_if $__inlined_func$src/assembly/TweenAxisCore/indexOf$210
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
       local.set $3
       global.get $src/assembly/TweenAxisCore/gInCount
       local.set $16
       loop $for-loop|08
        local.get $2
        local.get $16
        i32.const 1
        i32.sub
        i32.lt_s
        if
         local.get $3
         local.get $2
         i32.const 2
         i32.shl
         i32.add
         local.get $3
         local.get $2
         i32.const 1
         i32.add
         local.tee $2
         i32.const 2
         i32.shl
         i32.add
         i32.load
         i32.store
         br $for-loop|08
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
       local.get $15
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
       local.get $15
       i32.store
      end
     end
    end
    local.get $6
    i32.const 1
    i32.add
    local.set $6
    br $while-continue|0
   end
  end
  loop $while-continue|1
   local.get $6
   i32.const 1
   i32.sub
   local.tee $2
   i32.const 0
   i32.ge_s
   if (result i32)
    local.get $1
    local.get $4
    i32.load
    local.get $2
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
      local.get $4
      i32.load
      local.get $6
      i32.const 1
      i32.sub
      i32.const 3
      i32.shl
      i32.add
      f64.load
      local.get $1
      f64.eq
     else
      i32.const 0
     end
    end
   else
    i32.const 0
   end
   if
    local.get $4
    i32.load offset=12
    local.set $3
    i32.const 0
    local.get $4
    i32.load offset=4
    local.get $6
    i32.const 1
    i32.sub
    local.tee $6
    i32.const 2
    i32.shl
    i32.add
    i32.load
    local.tee $14
    i32.sub
    local.set $15
    i32.const 0
    local.set $2
    block $__inlined_func$src/assembly/TweenAxisCore/indexOf$212
     loop $for-loop|011
      local.get $0
      local.get $2
      i32.gt_s
      if
       local.get $3
       local.get $2
       i32.const 2
       i32.shl
       i32.add
       i32.load
       local.get $15
       i32.eq
       br_if $__inlined_func$src/assembly/TweenAxisCore/indexOf$212
       local.get $2
       i32.const 1
       i32.add
       local.set $2
       br $for-loop|011
      end
     end
     i32.const -1
     local.set $2
    end
    local.get $2
    i32.const -1
    i32.ne
    if
     local.get $4
     i32.load offset=12
     local.set $15
     local.get $0
     local.set $3
     local.get $2
     local.set $0
     loop $for-loop|013
      local.get $0
      local.get $3
      i32.const 1
      i32.sub
      i32.lt_s
      if
       local.get $15
       local.get $0
       i32.const 2
       i32.shl
       i32.add
       local.get $15
       local.get $0
       i32.const 1
       i32.add
       local.tee $0
       i32.const 2
       i32.shl
       i32.add
       i32.load
       i32.store
       br $for-loop|013
      end
     end
     local.get $3
     i32.const 1
     i32.sub
     local.set $0
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
     local.get $4
     i32.load offset=12
     local.set $3
     i32.const 0
     local.set $2
     block $__inlined_func$src/assembly/TweenAxisCore/indexOf$214
      loop $for-loop|016
       local.get $0
       local.get $2
       i32.gt_s
       if
        local.get $3
        local.get $2
        i32.const 2
        i32.shl
        i32.add
        i32.load
        local.get $14
        i32.eq
        br_if $__inlined_func$src/assembly/TweenAxisCore/indexOf$214
        local.get $2
        i32.const 1
        i32.add
        local.set $2
        br $for-loop|016
       end
      end
      i32.const -1
      local.set $2
     end
     local.get $2
     i32.const -1
     i32.ne
     if
      local.get $4
      i32.load offset=12
      local.set $15
      local.get $0
      local.set $3
      local.get $2
      local.set $0
      loop $for-loop|018
       local.get $0
       local.get $3
       i32.const 1
       i32.sub
       i32.lt_s
       if
        local.get $15
        local.get $0
        i32.const 2
        i32.shl
        i32.add
        local.get $15
        local.get $0
        i32.const 1
        i32.add
        local.tee $0
        i32.const 2
        i32.shl
        i32.add
        i32.load
        i32.store
        br $for-loop|018
       end
      end
      local.get $3
      i32.const 1
      i32.sub
      local.set $0
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
      local.set $3
      global.get $src/assembly/TweenAxisCore/gInCount
      local.set $15
      i32.const 0
      local.get $14
      i32.sub
      local.set $16
      i32.const 0
      local.set $2
      block $__inlined_func$src/assembly/TweenAxisCore/indexOf$216
       loop $for-loop|021
        local.get $2
        local.get $15
        i32.lt_s
        if
         local.get $3
         local.get $2
         i32.const 2
         i32.shl
         i32.add
         i32.load
         local.get $16
         i32.eq
         br_if $__inlined_func$src/assembly/TweenAxisCore/indexOf$216
         local.get $2
         i32.const 1
         i32.add
         local.set $2
         br $for-loop|021
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
       local.set $3
       global.get $src/assembly/TweenAxisCore/gInCount
       local.set $15
       loop $for-loop|023
        local.get $2
        local.get $15
        i32.const 1
        i32.sub
        i32.lt_s
        if
         local.get $3
         local.get $2
         i32.const 2
         i32.shl
         i32.add
         local.get $3
         local.get $2
         i32.const 1
         i32.add
         local.tee $2
         i32.const 2
         i32.shl
         i32.add
         i32.load
         i32.store
         br $for-loop|023
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
    br $while-continue|1
   end
  end
  local.get $4
  local.get $6
  i32.store offset=24
  i32.const 0
  global.set $src/assembly/TweenAxisCore/gResultCount
  loop $for-loop|2
   local.get $10
   global.get $src/assembly/TweenAxisCore/gOutCount
   i32.lt_s
   if
    local.get $4
    i32.load offset=8
    i32.const 0
    global.get $src/assembly/TweenAxisCore/gOutgoing
    local.get $10
    i32.const 2
    i32.shl
    i32.add
    i32.load
    local.tee $3
    i32.sub
    local.get $3
    local.get $3
    i32.const 0
    i32.lt_s
    select
    local.tee $6
    i32.const 3
    i32.shl
    i32.add
    f64.load
    local.set $18
    local.get $4
    i32.load
    i32.const 0
    local.set $2
    local.get $4
    i32.load offset=16
    local.set $15
    block $__inlined_func$src/assembly/TweenAxisCore/indexOfMarkKey$218
     loop $for-loop|026
      local.get $2
      local.get $15
      i32.lt_s
      if
       local.get $4
       i32.load offset=4
       local.get $2
       i32.const 2
       i32.shl
       i32.add
       i32.load
       local.get $3
       i32.eq
       br_if $__inlined_func$src/assembly/TweenAxisCore/indexOfMarkKey$218
       local.get $2
       i32.const 1
       i32.add
       local.set $2
       br $for-loop|026
      end
     end
     i32.const 0
     local.set $2
    end
    local.get $2
    i32.const 3
    i32.shl
    i32.add
    f64.load
    local.set $5
    local.get $3
    i32.const 0
    i32.lt_s
    if (result f64)
     local.get $18
     local.get $5
     local.get $7
     local.get $5
     local.get $18
     f64.sub
     local.tee $5
     f64.max
     f64.min
     local.get $5
     f64.sub
     local.tee $5
     f64.sub
    else
     local.get $5
     local.get $7
     local.get $5
     local.get $18
     f64.add
     f64.min
     f64.max
     local.get $5
     f64.sub
     local.tee $5
     f64.neg
    end
    local.set $19
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
    local.get $6
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
    local.get $5
    f64.mul
    local.get $18
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
    local.get $19
    f64.mul
    local.get $18
    f64.div
    f64.store
    global.get $src/assembly/TweenAxisCore/gResultCount
    i32.const 1
    i32.add
    global.set $src/assembly/TweenAxisCore/gResultCount
    local.get $10
    i32.const 1
    i32.add
    local.set $10
    br $for-loop|2
   end
  end
  loop $for-loop|3
   local.get $11
   global.get $src/assembly/TweenAxisCore/gInCount
   i32.lt_s
   if
    local.get $4
    i32.load offset=8
    i32.const 0
    global.get $src/assembly/TweenAxisCore/gIncoming
    local.get $11
    i32.const 2
    i32.shl
    i32.add
    i32.load
    local.tee $3
    i32.sub
    local.get $3
    local.get $3
    i32.const 0
    i32.lt_s
    select
    local.tee $6
    i32.const 3
    i32.shl
    i32.add
    f64.load
    local.set $18
    local.get $4
    i32.load
    i32.const 0
    local.set $2
    local.get $4
    i32.load offset=16
    local.set $14
    block $__inlined_func$src/assembly/TweenAxisCore/indexOfMarkKey$219
     loop $for-loop|028
      local.get $2
      local.get $14
      i32.lt_s
      if
       local.get $4
       i32.load offset=4
       local.get $2
       i32.const 2
       i32.shl
       i32.add
       i32.load
       local.get $3
       i32.eq
       br_if $__inlined_func$src/assembly/TweenAxisCore/indexOfMarkKey$219
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
    i32.const 3
    i32.shl
    i32.add
    f64.load
    local.set $5
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
    local.get $6
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
    local.get $3
    i32.const 0
    i32.lt_s
    if (result f64)
     local.get $5
     local.get $18
     f64.sub
     local.tee $19
     local.get $7
     local.get $9
     f64.add
     local.get $5
     f64.min
     f64.max
     local.get $19
     f64.sub
     local.get $18
     f64.sub
     local.set $5
     local.get $18
    else
     local.get $5
     local.get $7
     local.get $9
     f64.add
     local.get $5
     local.get $18
     f64.add
     f64.min
     f64.max
     local.get $5
     f64.sub
     local.set $5
     f64.const 0
    end
    f64.mul
    local.get $18
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
    local.get $5
    f64.mul
    local.get $18
    f64.div
    f64.store
    global.get $src/assembly/TweenAxisCore/gResultCount
    i32.const 1
    i32.add
    global.set $src/assembly/TweenAxisCore/gResultCount
    local.get $11
    i32.const 1
    i32.add
    local.set $11
    br $for-loop|3
   end
  end
  loop $for-loop|4
   local.get $0
   local.get $12
   i32.gt_s
   if
    local.get $4
    i32.load offset=8
    i32.const 0
    local.get $4
    i32.load offset=12
    local.get $12
    i32.const 2
    i32.shl
    i32.add
    i32.load
    local.tee $3
    i32.sub
    local.get $3
    local.get $3
    i32.const 0
    i32.lt_s
    select
    local.tee $6
    i32.const 3
    i32.shl
    i32.add
    f64.load
    local.set $5
    local.get $4
    i32.load
    i32.const 0
    local.set $2
    local.get $4
    i32.load offset=16
    local.set $11
    block $__inlined_func$src/assembly/TweenAxisCore/indexOfMarkKey$220
     loop $for-loop|032
      local.get $2
      local.get $11
      i32.lt_s
      if
       local.get $4
       i32.load offset=4
       local.get $2
       i32.const 2
       i32.shl
       i32.add
       i32.load
       local.get $3
       i32.eq
       br_if $__inlined_func$src/assembly/TweenAxisCore/indexOfMarkKey$220
       local.get $2
       i32.const 1
       i32.add
       local.set $2
       br $for-loop|032
      end
     end
     i32.const 0
     local.set $2
    end
    local.get $2
    i32.const 3
    i32.shl
    i32.add
    f64.load
    local.set $18
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
    local.get $6
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
    local.get $18
    local.get $5
    f64.sub
    f64.sub
    local.get $7
    local.get $18
    f64.sub
    local.get $3
    i32.const 0
    i32.lt_s
    select
    f64.mul
    local.get $5
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
    local.get $5
    f64.div
    f64.store
    global.get $src/assembly/TweenAxisCore/gResultCount
    i32.const 1
    i32.add
    global.set $src/assembly/TweenAxisCore/gResultCount
    local.get $12
    i32.const 1
    i32.add
    local.set $12
    br $for-loop|4
   end
  end
  loop $for-loop|5
   local.get $13
   global.get $src/assembly/TweenAxisCore/gInCount
   i32.lt_s
   if
    local.get $4
    i32.load offset=12
    local.get $0
    i32.const 2
    i32.shl
    i32.add
    global.get $src/assembly/TweenAxisCore/gIncoming
    local.get $13
    i32.const 2
    i32.shl
    i32.add
    i32.load
    i32.store
    local.get $0
    i32.const 1
    i32.add
    local.set $0
    local.get $13
    i32.const 1
    i32.add
    local.set $13
    br $for-loop|5
   end
  end
  local.get $4
  local.get $0
  i32.store offset=20
  i32.const 0
  global.set $src/assembly/TweenAxisCore/gOutCount
  i32.const 0
  global.set $src/assembly/TweenAxisCore/gInCount
  local.get $4
  local.get $1
  f64.store offset=32
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
  (local $0 i32)
  (local $1 i32)
  i32.const 1372
  global.set $~lib/rt/stub/offset
  i32.const 16
  i32.const 7
  call $~lib/rt/stub/__new
  local.tee $0
  i32.const 0
  i32.store
  local.get $0
  i32.const 0
  i32.store offset=4
  local.get $0
  i32.const 0
  i32.store offset=8
  local.get $0
  i32.const 0
  i32.store offset=12
  i32.const 32
  i32.const 1
  call $~lib/rt/stub/__new
  local.tee $1
  i32.const 0
  i32.const 32
  memory.fill
  local.get $0
  local.get $1
  i32.store
  local.get $0
  local.get $1
  i32.store offset=4
  local.get $0
  i32.const 32
  i32.store offset=8
  local.get $0
  i32.const 0
  i32.store offset=12
  local.get $0
  global.set $src/assembly/TweenAxisCore/gContexts
  i32.const 16
  i32.const 8
  call $~lib/rt/stub/__new
  local.tee $0
  i32.const 0
  i32.store
  local.get $0
  i32.const 0
  i32.store offset=4
  local.get $0
  i32.const 0
  i32.store offset=8
  local.get $0
  i32.const 0
  i32.store offset=12
  i32.const 32
  i32.const 1
  call $~lib/rt/stub/__new
  local.tee $1
  i32.const 0
  i32.const 32
  memory.fill
  local.get $0
  local.get $1
  i32.store
  local.get $0
  local.get $1
  i32.store offset=4
  local.get $0
  i32.const 32
  i32.store offset=8
  local.get $0
  i32.const 0
  i32.store offset=12
  local.get $0
  global.set $src/assembly/TweenAxisCore/gFreeSlots
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
