import { Textfield } from "@/components"


const UserInfo = () => {
    return (
      <div className='ml-3 pt-4 px-4 max-h-[750px] h-full w-full border border-add-minus rounded-lg'>
      <div className=" flex flex-col border-b-4 border-primary-color">
       <span className="text-[20px]">
          User Information</span>
      </div>
      <div className="mx-6 my-4 flex flex-col space-y-4 ">
        <div className="flex flex-col space-y-2 out">
          <span className="text-[20px] bold">First Name</span>
          <Textfield/>
        </div>
        <div>
          <span>Last Name</span>
          <Textfield/>
        </div>
        <div>
          <span>Username</span>
          <Textfield/>
        </div>

      </div>
     </div>
    )
  }
  
  export default UserInfo