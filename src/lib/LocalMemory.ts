class LocalMemory {
  static get instance(): LocalMemory {
    return instance;
  }


  getBoolean(key: string, defaultValue: boolean): boolean|null {
    const v = this.get<boolean>(key, defaultValue, this.setBoolean)
    return v==='n'?null:v==='1'?true:false
  }
  setBoolean(key: string, value: boolean) {
    this.set(key, value===null? 'n':value ? '1' : '0')
  }
  getString(key: string, defaultValue: string): string {
    return this.get<string>(key, defaultValue, this.setString);
  }
  setString(key: string, value: string) {
    this.set(key, value)
  }
  getNumber(key: string, defaultValue: number): number {
    return parseFloat(this.get<number>(key, defaultValue, this.setNumber))
  }
  setNumber(key: string, value: number) {
    this.set(key, value.toFixed())
  }
  getJSON(key: string, defaultValue: Map<string, string | number | boolean | null>): Map<string, string | number | boolean | null> {
    return JSON.parse(this.get<Map<string, string | number | boolean | null>>(key, defaultValue, this.setJSON))
  }
  setJSON(key: string, value: Map<string, string | number | boolean | null>) {
    this.set(key, JSON.stringify(value))
  }

  private get<T>(key: string, defaultValue: T, setter: (key: string, value: T) => void): string {
    let value = window.localStorage.getItem(key);
    if (value == null) {
      setter.call(this, key, defaultValue);
      return this.get<T>(key, defaultValue, setter);
    }
    return value;
  }
  private set(key: string, value: string) {
    window.localStorage.setItem(key, value);

  }
}

let instance = new LocalMemory();

export default LocalMemory