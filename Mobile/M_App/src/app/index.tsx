import { View, Text, Button } from "react-native";
import { useState } from "react";

export default function Home() {
  const [count, setCount] = useState(0);
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24 }}>Đã bấm: {count}</Text>
      <Button title="Bấm tôi" onPress={() => setCount(count + 1)} />
    </View>
  );
}