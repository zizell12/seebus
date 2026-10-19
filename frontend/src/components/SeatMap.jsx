import React from 'react'

export default function SeatMap({ rows, pattern = '2-2', selectedSeats, passengers, activePassenger, onSelectPassenger, onSelectSeat, labels }) {
  const groupSizes = (typeof pattern === 'string' ? pattern : '').split('-').map(Number)
  const seatGroups = groupSizes.length > 1 && groupSizes.every((size) => Number.isInteger(size) && size > 0)
    ? groupSizes
    : [2, 2]
  const gridTemplateColumns = seatGroups
    .map((size) => `repeat(${size}, var(--seat-size))`)
    .join(' 24px ')

  const selectedByOther = (seatNumber) =>
    Object.entries(selectedSeats).some(([passengerIndex, selectedSeat]) =>
      Number(passengerIndex) !== activePassenger && selectedSeat === seatNumber,
    )

  const activePassengerIndex = passengers.find((passenger) => passenger.index === activePassenger)?.index

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-bold text-navy-900 mb-2">{labels.selectPassenger}</h3>
        <div className="flex flex-wrap gap-2">
          {passengers.map((passenger) => (
            <button
              key={passenger.index}
              type="button"
              onClick={() => onSelectPassenger(passenger.index)}
              className={`rounded-lg border px-3 py-2 text-sm ${
                activePassenger === passenger.index
                  ? 'border-navy-900 bg-navy-900 text-white'
                  : 'border-gray-200 text-navy-900'
              }`}
            >
              {passenger.name || passenger.nama} {selectedSeats[passenger.index] ? `· ${selectedSeats[passenger.index]}` : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="min-w-0 rounded-2xl border border-gray-200 bg-gray-50 p-3 sm:p-4">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">{labels.front}</p>
        <div className="mx-auto w-full max-w-xs min-w-0 space-y-2 [--seat-size:44px] md:[--seat-size:48px]">
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="mx-auto grid w-fit max-w-full grid-rows-1 gap-x-2"
              style={{ gridTemplateColumns }}
            >
              {row.map((seat, seatIndex) => {
                const selected = selectedSeats[activePassengerIndex] === seat.seat_number
                const assignedToOther = selectedByOther(seat.seat_number)
                const available = seat.available && !assignedToOther
                let remainingSeats = seatIndex
                let gridColumn = 1
                for (const groupSize of seatGroups) {
                  if (remainingSeats < groupSize) {
                    gridColumn += remainingSeats
                    break
                  }
                  remainingSeats -= groupSize
                  gridColumn += groupSize + 1
                }

                return (
                  <button
                    key={seat.seat_number}
                    type="button"
                    disabled={!available}
                    onClick={() => onSelectSeat(activePassenger, seat.seat_number)}
                    style={{ gridColumn }}
                    className={`h-11 w-11 shrink-0 md:h-12 md:w-12 rounded-lg border p-0 text-sm font-semibold ${
                      selected
                        ? 'border-navy-900 bg-navy-900 text-white'
                        : available
                          ? 'border-brand-teal/40 bg-white text-brand-teal hover:bg-brand-teal/5'
                          : 'border-gray-200 bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    aria-label={`${labels.seat} ${seat.seat_number}${available ? '' : `, ${labels.unavailable}`}`}
                  >
                    {seat.seat_number}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-4 text-xs text-gray-500">
          <span><i className="mr-1 inline-block h-3 w-3 rounded border border-brand-teal/40 bg-white" />{labels.available}</span>
          <span><i className="mr-1 inline-block h-3 w-3 rounded bg-gray-200" />{labels.occupied}</span>
          <span><i className="mr-1 inline-block h-3 w-3 rounded bg-navy-900" />{labels.selected}</span>
        </div>
      </div>
    </div>
  )
}
