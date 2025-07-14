public class SSLTest { public static void main(String[] args) throws Exception { new java.net.URL("https://google.com").openConnection().connect(); System.out.println("SSL OK"); }}
