import Link from "next/link";
// import { getWebApplication as GetWebApplication } from "@/app/_components/getWebApplication";


export default function Special() {
    return (
      <div className="bg-white relative -z-11">
        <div className="mx-auto max-w-7xl py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="relative isolate overflow-hidden bg-gray-900 px-6 pt-16 shadow-2xl sm:rounded-3xl sm:px-16 md:pt-24 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">
            <svg
              viewBox="0 0 1024 1024"
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 -z-10 size-[64rem] -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-0"
            >
              <circle r={512} cx={512} cy={512} fill="url(#759c1415-0410-454c-8f7c-9a820de03641)" fillOpacity="0.7" />
              <defs>
                <radialGradient id="759c1415-0410-454c-8f7c-9a820de03641">
                  <stop stopColor="#7775D6" />
                  <stop offset={1} stopColor="#E935C1" />
                </radialGradient>
              </defs>
            </svg>
            <div className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-16 lg:text-left">
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                 Get A Web Application for your Business.
              </h2>
              <p className="mt-6 text-pretty text-lg/8 text-gray-300">
                Simplify and digitize your business to leverage the power of the Cloud.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
                <Link
                  href="/shop/orders/6"
                  className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >

                  Get started
                </Link>
                
              </div>
            </div>
            <div className="relative mt-16 h-80 lg:mt-20 align-">
              <img
                alt="App screenshot"
                src="https://utfs.io/f/zFJP5UraSTwKwlar0j7FNcaSY213do5B9V4M86IGzyjZTAeJ"
               
                className=" w-96 rounded-md bg-white/5 ring-1 ring-white/10 object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
  