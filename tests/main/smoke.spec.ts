describe('main process test harness', () => {
  it('runs in node environment', () => {
    expect(process.versions.node).toBeDefined()
  })
})
