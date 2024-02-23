export function makeTagsByName(name: string): string[] {
  const s = name.toLowerCase();
  const tags = [];
  if (s == 'sun') {
    tags.push('sun');
  }
  if (s.includes('sensor')) {
    tags.push('sensor');
  }
  if (s.includes('temperature')) {
    tags.push('temperature');
  }
  if (s.includes('humidity')) {
    tags.push('humidity');
  }
  if (s.includes('pressure')) {
    tags.push('pressure');
  }
  if (s.includes('battery')) {
    tags.push('battery');
  }
  if (s.includes('power')) {
    tags.push('power');
  }
  if (s.includes('contact')) {
    tags.push('contact');
  }
  if (s.includes('motion')) {
    tags.push('motion');
  }
  if (s.includes('phone')) {
    tags.push('phone');
  }  
  if (s.includes('hub')) {
    tags.push('hub');
  }  
  return tags;
}


