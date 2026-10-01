import { TimeAgoPipe } from './time-ago.pipe';

describe('TimeAgoPipe', () => {
  let pipe: TimeAgoPipe;

  beforeEach(() => {
    pipe = new TimeAgoPipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return "N/A" for null', () => {
    expect(pipe.transform(null)).toBe('N/A');
  });

  it('should return "N/A" for undefined', () => {
    expect(pipe.transform(undefined)).toBe('N/A');
  });

  it('should return "N/A" for empty string', () => {
    expect(pipe.transform('')).toBe('N/A');
  });

  it('should return "Just now" for a date less than 5 seconds ago', () => {
    const now = new Date();
    expect(pipe.transform(now.toISOString())).toBe('Just now');
  });

  it('should return seconds ago for recent dates', () => {
    const date = new Date(Date.now() - 30 * 1000);
    expect(pipe.transform(date.toISOString())).toBe('30s ago');
  });

  it('should return minutes ago', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000);
    expect(pipe.transform(date.toISOString())).toBe('5m ago');
  });

  it('should return hours ago', () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(pipe.transform(date.toISOString())).toBe('3h ago');
  });

  it('should return days ago', () => {
    const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    expect(pipe.transform(date.toISOString())).toBe('2d ago');
  });

  it('should return "Just now" for future dates', () => {
    const future = new Date(Date.now() + 60 * 60 * 1000);
    expect(pipe.transform(future.toISOString())).toBe('Just now');
  });

  it('should accept Date objects', () => {
    const now = new Date();
    expect(pipe.transform(now)).toBe('Just now');
  });
});
