let workInProgressHook
let isMount = true

const fiber = {
  memoizedState:null,
  stateNode: App
}



function schedule(){
  workInProgressHook = fiber.memoizedState
  const app = fiber.stateNode();
  isMount = false;
  return app
}


function dispatchAction(queue, action){
  // 创建upadte
  const update = {
    action,
    next:null 
  }
  if(queue.pending === null){
    update.next = update;
  }else{
    update.next = queue.pending.next;
    queue.pending.next = update;
  }
  // queue.pending 永远指向最新的update
  queue.pending = update

  schedule()
}


function useState(initialState){
  let hook;
  if(isMount){
    // 初始化
    hook = {
      queue:{
        pending: null
      },
      memoizedState: initialState,
      next:null 
    }
    if(!fiber.memoizedState){
      fiber.memoizedState = hook;
    } else{
      workInProgressHook.next = hook;
    }
  }else{
    // 非初始化
    hook = workInProgressHook
    // workInProgressHook 向前
    workInProgressHook = workInProgressHook.next
  }

  let baseState = hook.memoizedState 
  if(hook.queue.pending){
    let firstUpdate = hook.queue.pending.next
    do{
       const action = firstUpdate.action
       baseState = action(baseState);
      //  console.log("baseState",baseState)
       firstUpdate = firstUpdate.next;
    }while(firstUpdate !== hook.queue.pending)
    hook.queue.pending = null 
  }
  // 记忆新的state
  hook.memoizedState = baseState;

  return [baseState,dispatchAction.bind(null, hook.queue)]
}



// --------------- test --------------------
function App(){
  const [num,updateNum] = useState(0)
  console.log(`${isMount ? 'mount' : 'update'} num: `, num);

  return {
    click(){
      updateNum(num => num + 1);
    }
  }
}

window.app = schedule();
// app.click()