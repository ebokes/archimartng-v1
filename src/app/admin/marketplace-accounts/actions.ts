'use server'

import { revalidatePath } from 'next/cache'
import { changeMarketplaceAccountStatusFromAdmin } from '@/lib/admin-marketplace-accounts'
import { accountStatusFormResult } from '@/lib/marketplace-account-status-admin-interface'

export type AccountStatusFormState = { error: string | null; saved: boolean }

export async function saveMarketplaceAccountStatus(
  accountId: string,
  _state: AccountStatusFormState,
  formData: FormData,
): Promise<AccountStatusFormState> {
  const result = await accountStatusFormResult(
    accountId,
    formData,
    changeMarketplaceAccountStatusFromAdmin,
  )
  if (!result.saved) return result
  revalidatePath('/admin/marketplace-accounts')
  revalidatePath(`/admin/marketplace-accounts/${accountId}`)
  return result
}
