/**
 * In-memory fixed-capacity circular ring buffer
 * Ensures constant memory footprint (O(1) insertion, max 100 records)
 */
class RingBuffer {
  constructor(capacity = 100) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }

  push(item) {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;

    if (this.count < this.capacity) {
      this.count++;
    } else {
      this.head = (this.head + 1) % this.capacity;
    }
  }

  getAll() {
    const items = [];
    for (let i = 0; i < this.count; i++) {
      items.push(this.buffer[(this.head + i) % this.capacity]);
    }
    return items;
  }

  size() {
    return this.count;
  }
}

module.exports = RingBuffer;
