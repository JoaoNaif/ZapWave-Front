type Iso = string

export interface UserDto {
  id: string
  username: string
  displayName: string
  email: string
  createdAt: Iso
  updatedAt: Iso
}

export interface UserSummaryDto {
  id: string
  username: string
  displayName: string
}
