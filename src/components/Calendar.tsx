import { Tooltip } from 'react-tooltip'

export const generateCalendar = (currentDate:Date, reservedDates?:{ reserveID:number, checkin:Date, checkout:Date }[], handleSelectedDate?: (date: Date) => void ) => {
  const startOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const startDayOfWeek = startOfCurrentMonth.getDay();
  const totalDaysInMonth = endOfCurrentMonth.getDate();

  const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 0);
  const totalDaysInPrevMonth = prevMonth.getDate();
  

  //create today with 12:00 PM
  const today = new Date();
  today.setHours(12,0,0,0);

  let calendarDays = [];

  // Add days from the previous month
  for (let i = startDayOfWeek; i > 0; i--) {
    calendarDays.push(
      <span key={`prev-${i}`} className="bg-gray-100 flex items-center justify-center h-10 text-gray-400 rounded-xl">
        {totalDaysInPrevMonth - i + 1}
      </span>
    );
  }

  // Add days from the current month
  for (let i = 1; i <= totalDaysInMonth; i++) {
    const currentIterationDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i, 12, 0, 0, 0);
    if(currentIterationDate < today){
      calendarDays.push(
        <span key={`past-${i}`} className="bg-gray-100 flex items-center justify-center h-10 text-gray-400 rounded-xl">
          {i}
        </span>
      );
    }else{
      const reserve = reservedDates?.find((reserve) => reserve.checkin <= currentIterationDate && reserve.checkout >= currentIterationDate);
      if (reserve) {
        calendarDays.push(
          <span 
            key={`reserved-${i}`} 
            className={`cursor-pointer bg-tertiary text-white flex items-center justify-center h-10 hover:bg-secondary hover:text-white duration-300 rounded-xl 
              ${currentDate.getDate() === i && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear() ? "border-2 border-slate-400" : ""}`}
            data-tooltip-id="my-tooltip" data-tooltip-content={`${reserve.reserveID}`}
          >
            {i}
          </span>
        );
      }else{
        calendarDays.push(
          <span key={`current-${i}`} 
            onClick={handleSelectedDate ? () => handleSelectedDate(currentIterationDate) : undefined}
            className={`cursor-pointer bg-white text-secondary flex items-center justify-center h-10 hover:bg-secondary hover:text-white duration-300 rounded-xl 
            ${currentDate.getDate() === i  && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear() ? "border-2 border-slate-400": "" }`}>
            {i}
          </span>
        );
      } 
    } 

  }

  // Add days from the next month
  const remainingDays = 42 - calendarDays.length; // 42 = 6 weeks * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    calendarDays.push(
      <span key={`next-${i}`} className="bg-gray-100 flex items-center justify-center h-10 text-gray-400 rounded-xl">
        {i}
      </span>
    );
  }

  return (
    <>
      {calendarDays}
      <Tooltip id="my-tooltip" style={{ backgroundColor:"#00AAA9", borderRadius:"10px" }} />
    </>
  );
};

export default generateCalendar;

