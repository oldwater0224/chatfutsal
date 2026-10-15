import { writeBatch, WriteBatch } from "firebase/firestore";
import { db } from "../firebase";

export type BatchOp = (batch: WriteBatch) => void;

// writeBatch는 한 번에 최대 500개 작업까지 가능하므로 나눠서 커밋한다.
// 앞쪽 작업이 먼저 커밋되므로, 보안 규칙상 먼저 반영돼야 하는 쓰기는 앞에 둔다.
export async function commitInChunks(ops: BatchOp[], limit = 500): Promise<void> {
  for (let i = 0; i < ops.length; i += limit) {
    const batch = writeBatch(db);
    ops.slice(i, i + limit).forEach((op) => op(batch));
    await batch.commit();
  }
}
