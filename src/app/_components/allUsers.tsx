"use client";
import Button from "@mui/material/Button/Button";
import { api } from "~/trpc/react";

export default function AllProjects() {
  const [allUsers] = api.user.getAll.useSuspenseQuery();

  return (
    <div>
      {allUsers.length == 0 ? "You Have No Users Yet" : ""}
      <ul
        role="list"
        className="flex flex-col gap-2 divide-y divide-white px-4"
      >
        {allUsers.map((user) => (
          <li
            key={user.id}
            className="gap-x-6 rounded-md bg-gray-100 p-3 py-5 "
          > 
            <div className="bg-slate-400 mb-3 rounded-sm">
              <p className=" text-center text-sm text-white font-bold">{user.name}</p>
            </div>
            <div className="flex justify-between">
              <div className="min-w-0">
                {user.image ? <img
                  alt=""
                  src={user.image}
                  className="size-12 flex-none rounded-full"
                />: " "}
                
              </div>
              <div className="min-w-0">
                <p className="rounded-se-xl bg-red-500 px-1 text-xs/6 font-semibold">
                  User Email: {user.email}
                </p>
                  
                <p className="text-sm/6 font-semibold text-gray-900">
                  Verified: {user.emailVerified?.toDateString()}
                </p>
              </div>
            </div>
            
            
            <div className="justify-self-center p2-3">
              <Button
                style={{
                  minWidth: "200px",
                  minHeight: "30px",
                  position: "inherit",
                }}
                variant="contained"
                className="w-full bg-slate-400"
                href={`user/${user.id}`}
              >
                View User
              </Button>
            </div>

                    
          </li>
        ))}
      </ul>
    </div>
  );
}
