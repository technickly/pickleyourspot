  if (current.some(s => s.startTime === slot.startTime)) {
    return current.filter(s => {
      const index = timeSlots.findIndex(ts => ts.startTime === s.startTime);
      return index <= slotIndex;
    });
  }

  if (slotIndex === lastSelectedIndex + 1 && current.length < 3) {
    return [...current, slot];
  }

  return [slot];
}); 