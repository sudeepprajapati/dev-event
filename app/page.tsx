import EventCard from "@/components/EventCard"
import ExploreBtn from "@/components/ExploreBtn"
import { time } from "console"

const events = [
  {
    image: '/images/event1.png',
    title: 'Tech Conference 2025',
    slug: 'tech-conference-2025',
    location: 'New York, USA',
    date: 'March 15-17, 2025',
    time: '9:00 AM - 6:00 PM',
  },
  {
    image: '/images/event2.png',
    title: 'Dev Conference 2025',
    slug: 'tech-conference-2025',
    location: 'New York, USA',
    date: 'March 15-17, 2025',
    time: '9:00 AM - 6:00 PM',
  },
  {
    image: '/images/event3.png',
    title: 'AI Conference 2026',
    slug: 'tech-conference-2025',
    location: 'New York, USA',
    date: 'March 15-17, 2025',
    time: '9:00 AM - 6:00 PM',
  }
]

const page = () => {
  return (
    <section >
      <h1 className="text-center">The Hub for Every Dev <br /> Event You Can't Miss</h1>
      <p className="text-center mt-5">Hackathons, Meetups, and Conferences, All in One Place</p>
      <ExploreBtn />

      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>

        <ul className="events " >
          {events.map((event) => (
            <li key={event.title}>
              <EventCard {...event} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default page